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

interface RoomAmenity {
  room_type: string;
  room_number: number;
  amenities: string[];
}

interface PropertyFeature {
  category: string;
  name: string;
}

interface ExtractedRoom {
  name: string;
  room_type: string;
}

interface AnalysisResult {
  items: DiscoveredItem[];
  rooms?: ExtractedRoom[];
  roomAmenities?: RoomAmenity[];
  propertyFeatures?: PropertyFeature[];
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
1. Room counts - for each room use these exact room_type values: bedroom, bathroom, kitchen, living_room, dining_room, hall, balcony, garage, laundry, office, storage, patio, garden, basement, attic
2. Amenities - things inside rooms like appliances, furniture, etc.
3. Property features - select from these predefined categories and names:
   - parking: "Free parking on premises", "Free street parking", "EV charger"
   - pets: "Pets allowed", "Pet bowls", "Fenced yard"
   - family: "Crib", "High chair", "Baby monitor", "Outlet covers", "Stair gates"
   - cleaning: "Cleaning supplies", "Vacuum cleaner", "Mop", "Luggage drop-off allowed"
   - extras: "Welcome snacks", "Coffee and tea", "Slippers", "Bathrobes"
   - misc: "Long-term stays allowed", "Smoking allowed", "Events allowed", "Smoke alarm", "Carbon monoxide alarm", "Fire extinguisher"
4. Property details (square footage, price, address if visible)

Be thorough and list EVERY amenity and feature you can identify.

Return your response as a JSON object with this structure:
{
  "rooms": [
    { "name": "Master Bedroom", "room_type": "bedroom" },
    { "name": "En-suite Bathroom", "room_type": "bathroom" }
  ],
  "roomAmenities": [
    { "room_type": "bedroom", "room_number": 1, "amenities": ["Bed", "Wardrobe", "Air conditioning"] },
    { "room_type": "bathroom", "room_number": 1, "amenities": ["Shower / Bathtub", "Hot water", "Towels"] }
  ],
  "propertyFeatures": [
    { "category": "parking", "name": "Free parking on premises" },
    { "category": "misc", "name": "Smoke alarm" }
  ],
  "items": [
    { "type": "room", "name": "Master Bedroom", "category": "bedroom", "confidence": 0.95 },
    { "type": "amenity", "name": "WiFi", "category": "technology", "confidence": 0.9 },
    { "type": "feature", "name": "Free parking on premises", "category": "parking", "confidence": 0.85 }
  ],
  "summary": "A brief description of the property",
  "propertyDetails": {
    "bedrooms": 2,
    "bathrooms": 1,
    "squareFeet": 1200,
    "description": "A modern apartment with great amenities"
  }
}

IMPORTANT: For propertyFeatures, ONLY use the exact names listed above. For room_type, use the exact values specified.`
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

    console.log(`Discovered ${result.items?.length || 0} items, ${result.rooms?.length || 0} rooms, ${result.propertyFeatures?.length || 0} features`);

    // Save rooms with their amenities to space_amenity table
    // Group rooms by type to assign proper room numbers
    const roomsByType: Record<string, ExtractedRoom[]> = {};
    if (result.rooms) {
      for (const room of result.rooms) {
        if (!roomsByType[room.room_type]) {
          roomsByType[room.room_type] = [];
        }
        roomsByType[room.room_type].push(room);
      }
    }

    // Create amenities for each room (this is what the UI reads)
    const roomAmenitiesRecords: any[] = [];
    
    // Process roomAmenities if provided by the model
    if (result.roomAmenities && result.roomAmenities.length > 0) {
      for (const ra of result.roomAmenities) {
        for (const amenityName of ra.amenities) {
          roomAmenitiesRecords.push({
            space_id: spaceId,
            name: amenityName,
            room_type: ra.room_type,
            room_number: ra.room_number,
            status: 'verified',
            required: false,
          });
        }
      }
    } else if (result.rooms) {
      // Fallback: create a placeholder amenity for each room so it shows in the UI
      let roomCounter: Record<string, number> = {};
      for (const room of result.rooms) {
        if (!roomCounter[room.room_type]) {
          roomCounter[room.room_type] = 0;
        }
        roomCounter[room.room_type]++;
        const roomNumber = roomCounter[room.room_type];
        
        // Add a basic amenity so the room appears
        roomAmenitiesRecords.push({
          space_id: spaceId,
          name: room.name || `${room.room_type} ${roomNumber}`,
          room_type: room.room_type,
          room_number: roomNumber,
          status: 'verified',
          required: false,
        });
      }
    }

    // Save room amenities
    if (roomAmenitiesRecords.length > 0) {
      const { error: roomAmenityError } = await supabase
        .from("space_amenity")
        .upsert(roomAmenitiesRecords, { onConflict: 'space_id,name,room_type,room_number' });

      if (roomAmenityError) {
        console.error("Error saving room amenities:", roomAmenityError);
      } else {
        console.log(`Saved ${roomAmenitiesRecords.length} room amenities to database`);
      }
    }

    // Save property features (misc amenities) with correct category and exact names
    if (result.propertyFeatures && result.propertyFeatures.length > 0) {
      const featureRecords = result.propertyFeatures.map(f => ({
        space_id: spaceId,
        name: f.name,
        room_type: f.category,
        room_number: 1,
        status: 'provided',
        required: false,
      }));

      const { error: featureError } = await supabase
        .from("space_amenity")
        .upsert(featureRecords, { onConflict: 'space_id,name,room_type,room_number' });

      if (featureError) {
        console.error("Error saving property features:", featureError);
      } else {
        console.log(`Saved ${featureRecords.length} property features to database`);
      }
    }

    // Also save to room table for reference
    if (result.rooms && result.rooms.length > 0) {
      let roomCounter: Record<string, number> = {};
      const roomRecords = result.rooms.map((room) => {
        if (!roomCounter[room.room_type]) {
          roomCounter[room.room_type] = 0;
        }
        roomCounter[room.room_type]++;
        return {
          space_id: spaceId,
          name: room.name,
          room_type: room.room_type,
          room_number: roomCounter[room.room_type],
        };
      });

      const { error: roomError } = await supabase
        .from("room")
        .upsert(roomRecords, { onConflict: 'space_id,name' });

      if (roomError) {
        console.error("Error saving rooms:", roomError);
      } else {
        console.log(`Saved ${roomRecords.length} rooms to database`);
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
