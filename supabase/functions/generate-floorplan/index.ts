import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spaceId, address, propertyName, rooms, fileUrls } = await req.json();
    
    const TOWER_API_KEY = Deno.env.get('TOWER_API_KEY');
    if (!TOWER_API_KEY) {
      throw new Error('TOWER_API_KEY is not configured');
    }

    console.log('Generating floor plan for space:', spaceId, { address, propertyName, rooms, fileUrls });

    if (!spaceId) {
      throw new Error('SPACE_ID is required for floor plan generation');
    }

    // Call Tower.dev API with SPACE_ID as the parameter
    const apiUrl = 'https://api.tower.dev/v1/apps/hercules/runs';
    console.log('Calling Tower.dev API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TOWER_API_KEY,
      },
      body: JSON.stringify({
        environment: 'default',
        parameters: {
          SPACE_ID: spaceId,
        },
      }),
    });

    // Get the raw response text first
    const responseText = await response.text();
    console.log('Tower.dev response status:', response.status);
    console.log('Tower.dev response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log('Tower.dev raw response (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('Tower.dev API error:', response.status, responseText.substring(0, 1000));
      throw new Error(`Tower.dev API error: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error(`Tower.dev returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    console.log('Tower.dev parsed response:', JSON.stringify(data).substring(0, 500));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating floor plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate floor plan' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
