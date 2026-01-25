import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Fields we want to collect for onboarding
const REQUIRED_FIELDS = [
  { key: 'name', label: 'Property Name', category: 'basic' },
  { key: 'address', label: 'Street Address', category: 'location' },
  { key: 'city', label: 'City', category: 'location' },
  { key: 'state', label: 'State/Province', category: 'location' },
  { key: 'zipCode', label: 'ZIP/Postal Code', category: 'location' },
  { key: 'country', label: 'Country', category: 'location' },
  { key: 'description', label: 'Description', category: 'basic' },
  { key: 'propertyType', label: 'Property Type', category: 'basic' },
  { key: 'bedrooms', label: 'Number of Bedrooms', category: 'details' },
  { key: 'bathrooms', label: 'Number of Bathrooms', category: 'details' },
  { key: 'maxGuests', label: 'Maximum Guests', category: 'details' },
  { key: 'basePrice', label: 'Base Price per Night', category: 'pricing' },
];

interface SpaceInfo {
  space: any;
  rooms: any[];
  amenities: any[];
  observations: any[];
  documents: any[];
}

async function fetchSpaceInfo(supabase: any, spaceId: string): Promise<SpaceInfo> {
  const [spaceRes, roomsRes, amenitiesRes, observationsRes, documentsRes] = await Promise.all([
    supabase.from('space').select('*').eq('id', spaceId).single(),
    supabase.from('room').select('*').eq('space_id', spaceId),
    supabase.from('space_amenity').select('*').eq('space_id', spaceId),
    supabase.from('observation').select('*').eq('space_id', spaceId),
    supabase.from('space_document').select('*').eq('space_id', spaceId),
  ]);

  return {
    space: spaceRes.data,
    rooms: roomsRes.data || [],
    amenities: amenitiesRes.data || [],
    observations: observationsRes.data || [],
    documents: documentsRes.data || [],
  };
}

function calculateProgress(spaceInfo: SpaceInfo) {
  const metadata = spaceInfo.space?.metadata || {};
  const space = spaceInfo.space || {};
  
  const filledFields: string[] = [];
  const missingFields: string[] = [];
  
  REQUIRED_FIELDS.forEach(field => {
    const value = metadata[field.key] || space[field.key];
    if (value && String(value).trim() !== '') {
      filledFields.push(field.key);
    } else {
      missingFields.push(field.key);
    }
  });

  const percent = Math.round((filledFields.length / REQUIRED_FIELDS.length) * 100);

  return {
    percent,
    filledFields,
    missingFields,
    total: REQUIRED_FIELDS.length,
    filled: filledFields.length,
    fieldDetails: REQUIRED_FIELDS.map(f => ({
      ...f,
      filled: filledFields.includes(f.key),
      value: metadata[f.key] || space[f.key] || null,
    })),
  };
}

async function getConversationMessages(supabase: any, spaceId: string) {
  const { data, error } = await supabase
    .from('conversation_message')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching conversation:', error);
    return [];
  }
  return data || [];
}

async function saveConversationMessage(supabase: any, spaceId: string, role: string, content: string) {
  const { error } = await supabase
    .from('conversation_message')
    .insert({ space_id: spaceId, role, content });
  
  if (error) {
    console.error('Error saving message:', error);
  }
}

function buildSystemPrompt(spaceInfo: SpaceInfo, progress: any) {
  const missingFieldLabels = progress.fieldDetails
    .filter((f: any) => !f.filled)
    .map((f: any) => f.label)
    .join(', ');

  const filledFieldsSummary = progress.fieldDetails
    .filter((f: any) => f.filled)
    .map((f: any) => `${f.label}: ${f.value}`)
    .join('\n');

  return `You are Ms. T, a friendly and efficient AI assistant helping property owners complete their property listing. Your goal is to gather all necessary information to create a complete property profile.

CURRENT PROPERTY STATUS:
- Name: ${spaceInfo.space?.name || 'Not set'}
- Type: ${spaceInfo.space?.space_type || 'property'}
- Completion: ${progress.percent}%

ALREADY COLLECTED:
${filledFieldsSummary || 'No information collected yet.'}

STILL NEEDED:
${missingFieldLabels || 'All information collected!'}

ROOMS ADDED: ${spaceInfo.rooms.length}
AMENITIES: ${spaceInfo.amenities.length}
OBSERVATIONS: ${spaceInfo.observations.length}

YOUR BEHAVIOR:
1. Be conversational but efficient - ask for 1-2 missing fields at a time
2. When you receive information, acknowledge it warmly and move to the next missing items
3. If the user uploads files, acknowledge what you extracted from them
4. If there's conflicting information, politely ask for clarification
5. Celebrate milestones (25%, 50%, 75%, 100% completion)
6. Keep responses concise but friendly (2-4 sentences typically)
7. When all required fields are filled, congratulate them and suggest next steps (uploading photos, adding amenities)

RESPONSE FORMAT:
- Always respond in a helpful, conversational tone
- If extracting data, summarize what you understood
- End with a clear question or call-to-action when information is still needed

IMPORTANT: Your response will be parsed. You MUST include a JSON block at the END of your response with this structure:
\`\`\`json
{
  "extracted": {"fieldKey": "value"},
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
\`\`\`

Rules for the JSON block:
- "extracted": Include ONLY if you identified new data to save. Keys: name, address, city, state, zipCode, country, description, propertyType, bedrooms, bathrooms, maxGuests, basePrice
- "suggestions": ALWAYS include 2-4 quick reply options that make sense for your question. These should be actual answers the user might give, not generic options. Examples:
  - If asking about bedrooms: ["1 bedroom", "2 bedrooms", "3 bedrooms", "4+ bedrooms"]
  - If asking about city: ["I'll type it", "Skip for now"]
  - If asking about property type: ["House", "Apartment", "Condo", "Villa"]
  - If asking about description: ["Help me write one", "I'll type it myself"]`;
}

async function continueConversation(
  spaceInfo: SpaceInfo,
  progress: any,
  messages: any[],
  userMessage: string | null
) {
  const systemPrompt = buildSystemPrompt(spaceInfo, progress);
  
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  if (userMessage) {
    apiMessages.push({ role: 'user', content: userMessage });
  }

  // If no messages at all, generate initial greeting
  if (messages.length === 0 && !userMessage) {
    apiMessages.push({ 
      role: 'user', 
      content: 'Start the conversation. Greet me and ask about my property.' 
    });
  }

  console.log('Calling Lovable AI with messages:', apiMessages.length);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you please try again?';
}

function parseExtractedData(aiResponse: string): { cleanResponse: string; extracted: Record<string, any> | null; suggestions: string[] } {
  const jsonMatch = aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const cleanResponse = aiResponse.replace(/```json\s*\{[\s\S]*?\}\s*```/, '').trim();
      return { 
        cleanResponse, 
        extracted: parsed.extracted || null,
        suggestions: parsed.suggestions || []
      };
    } catch (e) {
      console.error('Failed to parse extracted JSON:', e);
    }
  }
  
  return { cleanResponse: aiResponse, extracted: null, suggestions: [] };
}

async function updateSpaceMetadata(supabase: any, spaceId: string, extracted: Record<string, any>) {
  // Get current metadata
  const { data: space } = await supabase
    .from('space')
    .select('metadata, name, address, description')
    .eq('id', spaceId)
    .single();

  const currentMetadata = space?.metadata || {};
  const updatedMetadata = { ...currentMetadata, ...extracted };

  // Update top-level fields if provided
  const updateData: any = { metadata: updatedMetadata };
  if (extracted.name) updateData.name = extracted.name;
  if (extracted.address) updateData.address = extracted.address;
  if (extracted.description) updateData.description = extracted.description;

  const { error } = await supabase
    .from('space')
    .update(updateData)
    .eq('id', spaceId);

  if (error) {
    console.error('Error updating space metadata:', error);
  } else {
    console.log('Updated space metadata:', extracted);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const spaceId = pathParts[pathParts.length - 1];

    if (!spaceId || spaceId === 'space-continue') {
      return new Response(
        JSON.stringify({ error: 'Space ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { messages, userMessage, uploadedFiles } = await req.json().catch(() => ({}));

    console.log(`[space-continue] spaceId=${spaceId}, hasMessages=${!!messages}, hasUserMessage=${!!userMessage}`);

    // If no messages provided, load everything from DB
    if (!messages || messages.length === 0) {
      const spaceInfo = await fetchSpaceInfo(supabase, spaceId);
      
      if (!spaceInfo.space) {
        return new Response(
          JSON.stringify({ error: 'Space not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const conversationMessages = await getConversationMessages(supabase, spaceId);
      const progress = calculateProgress(spaceInfo);

      // If no conversation yet, generate initial greeting
      if (conversationMessages.length === 0) {
        const initialResponse = await continueConversation(spaceInfo, progress, [], null);
        const { cleanResponse, suggestions } = parseExtractedData(initialResponse);
        
        await saveConversationMessage(supabase, spaceId, 'assistant', cleanResponse);

        return new Response(
          JSON.stringify({
            onboarding_percent: progress.percent,
            progress_details: progress,
            space: spaceInfo.space,
            messages: [{ role: 'assistant', content: cleanResponse, created_at: new Date().toISOString() }],
            suggestions,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          onboarding_percent: progress.percent,
          progress_details: progress,
          space: spaceInfo.space,
          messages: conversationMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })),
          suggestions: [], // No suggestions when loading existing conversation
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User sent a new message - process it
    if (userMessage) {
      // Save user message
      await saveConversationMessage(supabase, spaceId, 'user', userMessage);

      // Get fresh space info
      const spaceInfo = await fetchSpaceInfo(supabase, spaceId);
      const progress = calculateProgress(spaceInfo);

      // Build context with uploaded files if any
      let contextMessage = userMessage;
      if (uploadedFiles && uploadedFiles.length > 0) {
        contextMessage += `\n\n[User also uploaded ${uploadedFiles.length} file(s): ${uploadedFiles.map((f: any) => f.name).join(', ')}]`;
      }

      // Get AI response
      const assistantResponse = await continueConversation(spaceInfo, progress, messages, contextMessage);
      const { cleanResponse, extracted, suggestions } = parseExtractedData(assistantResponse);

      // Save extracted data if any
      if (extracted && Object.keys(extracted).length > 0) {
        await updateSpaceMetadata(supabase, spaceId, extracted);
      }

      // Save assistant response
      await saveConversationMessage(supabase, spaceId, 'assistant', cleanResponse);

      // Recalculate progress after potential updates
      const updatedSpaceInfo = await fetchSpaceInfo(supabase, spaceId);
      const updatedProgress = calculateProgress(updatedSpaceInfo);

      return new Response(
        JSON.stringify({
          onboarding_percent: updatedProgress.percent,
          progress_details: updatedProgress,
          space: updatedSpaceInfo.space,
          messages: [
            ...messages,
            { role: 'user', content: userMessage, created_at: new Date().toISOString() },
            { role: 'assistant', content: cleanResponse, created_at: new Date().toISOString() },
          ],
          extracted,
          suggestions,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Either provide no messages to load, or provide userMessage to continue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Continue conversation error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to continue conversation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
