import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscoveredItem {
  type: 'amenity' | 'room' | 'feature' | 'detail';
  name: string;
  category: string;
  value?: string | number;
  confidence: number;
}

interface AnalysisResult {
  items: DiscoveredItem[];
  summary: string;
  propertyDetails: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    price?: number;
    address?: string;
    description?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { spaceId, documentUrls, context } = await req.json();

    if (!spaceId) {
      return new Response(JSON.stringify({ error: "spaceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all documents for this space if not provided
    let docs = documentUrls || [];
    if (docs.length === 0) {
      const { data: documents } = await supabase
        .from("space_document")
        .select("storage_url, file_name, file_type")
        .eq("space_id", spaceId);

      if (documents) {
        docs = documents.map((d: any) => ({
          url: d.storage_url,
          name: d.file_name,
          type: d.file_type,
        }));
      }
    }

    // Build content for OpenAI - for images, we'll use vision
    const messages: any[] = [
      {
        role: "system",
        content: `You are a property analysis expert. Analyze the provided documents/images and extract all property information.

Extract and return:
1. Room counts (bedrooms, bathrooms, living rooms, kitchens, etc.)
2. Amenities (WiFi, parking, pool, gym, washer/dryer, AC, heating, etc.)
3. Property features (balcony, garden, garage, etc.)
4. Property details (square footage, price, address if visible)
5. Any other notable features or details

Be thorough and list EVERY amenity and feature you can identify from the images or documents.

Return your response as a JSON object with this structure:
{
  "items": [
    { "type": "room", "name": "Master Bedroom", "category": "bedroom", "confidence": 0.95 },
    { "type": "amenity", "name": "WiFi", "category": "technology", "confidence": 0.9 },
    { "type": "feature", "name": "Balcony", "category": "outdoor", "confidence": 0.85 }
  ],
  "summary": "A brief description of the property",
  "propertyDetails": {
    "bedrooms": 2,
    "bathrooms": 1,
    "squareFeet": 1200,
    "description": "A modern apartment with great amenities"
  }
}

Categories for amenities: bedroom, bathroom, kitchen, living, laundry, technology, safety, entrance, outdoor, recreation, parking, pets, family, cleaning, extras.
Types: room, amenity, feature, detail.`
      }
    ];

    // Build user message with images
    const userContent: any[] = [];
    
    if (context) {
      userContent.push({ type: "text", text: `Additional context: ${context}` });
    }

    userContent.push({ 
      type: "text", 
      text: `Please analyze these ${docs.length} document(s)/image(s) and extract all property information:` 
    });

    // Add images to the message
    for (const doc of docs) {
      const url = typeof doc === 'string' ? doc : doc.url;
      const name = typeof doc === 'string' ? 'Document' : doc.name;
      
      if (url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif'))) {
        userContent.push({
          type: "image_url",
          image_url: { url, detail: "high" }
        });
      } else {
        userContent.push({
          type: "text",
          text: `Document: ${name} (URL: ${url})`
        });
      }
    }

    messages.push({ role: "user", content: userContent });

    console.log(`Analyzing ${docs.length} documents for space ${spaceId}`);

    // Call OpenAI with the newest model (gpt-4o)
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return new Response(JSON.stringify({ error: "OpenAI API error", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from OpenAI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: AnalysisResult;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", content);
      return new Response(JSON.stringify({ error: "Invalid response format", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Discovered ${result.items?.length || 0} items`);

    // Optionally save discovered amenities to the database
    if (result.items && result.items.length > 0) {
      const amenities = result.items
        .filter(item => item.type === 'amenity' || item.type === 'feature')
        .map(item => ({
          space_id: spaceId,
          name: item.name,
          room_type: item.category,
          room_number: 1, // Default room number for general amenities
          status: 'verified',
        }));

      if (amenities.length > 0) {
        const { error: insertError } = await supabase
          .from("space_amenity")
          .upsert(amenities, { onConflict: 'space_id,name,room_type,room_number' });

        if (insertError) {
          console.error("Error saving amenities:", insertError);
        } else {
          console.log(`Saved ${amenities.length} amenities to database`);
        }
      }

      // Save rooms
      const rooms = result.items
        .filter(item => item.type === 'room')
        .map((item, idx) => ({
          space_id: spaceId,
          name: item.name,
          room_type: item.category,
          room_number: idx + 1,
        }));

      if (rooms.length > 0) {
        const { error: roomError } = await supabase
          .from("room")
          .upsert(rooms, { onConflict: 'space_id,name' });

        if (roomError) {
          console.error("Error saving rooms:", roomError);
        } else {
          console.log(`Saved ${rooms.length} rooms to database`);
        }
      }

      // Update space metadata with property details
      if (result.propertyDetails) {
        const { data: currentSpace } = await supabase
          .from("space")
          .select("metadata, description")
          .eq("id", spaceId)
          .single();

        const currentMetadata = (currentSpace?.metadata || {}) as Record<string, any>;
        const updates: any = {
          metadata: {
            ...currentMetadata,
            ...(result.propertyDetails.bedrooms && { bedrooms: result.propertyDetails.bedrooms }),
            ...(result.propertyDetails.bathrooms && { bathrooms: result.propertyDetails.bathrooms }),
            ...(result.propertyDetails.squareFeet && { square_feet: result.propertyDetails.squareFeet }),
            ...(result.propertyDetails.price && { price: result.propertyDetails.price }),
          },
          updated_at: new Date().toISOString(),
        };

        if (result.propertyDetails.description && !currentSpace?.description) {
          updates.description = result.propertyDetails.description;
        }
        if (result.propertyDetails.address) {
          updates.address = result.propertyDetails.address;
        }

        await supabase
          .from("space")
          .update(updates)
          .eq("id", spaceId);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
