
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedQuery {
  jobTitle?: string;
  location?: string;
  keywords?: string;
  remote?: boolean;
  searchSource: 'jsearch' | 'xray' | 'both';
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Parsing natural language query:', query);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI job search query parser. Convert natural language job search queries into structured parameters.

Rules:
1. Extract job title, location, keywords, and remote preference
2. Determine best search source: "jsearch" for general jobs, "xray" for specific companies/advanced searches, "both" for comprehensive searches
3. Return confidence score (0-100) based on query clarity
4. For ambiguous queries, prefer jsearch and add relevant keywords
5. Remote preference: true if mentioned explicitly, false otherwise

Examples:
"AI product manager remote" → {"jobTitle": "product manager", "keywords": "AI", "remote": true, "searchSource": "jsearch", "confidence": 95}
"Software engineer at Google in Mountain View" → {"jobTitle": "software engineer", "location": "Mountain View", "keywords": "Google", "searchSource": "xray", "confidence": 90}
"Find me startup jobs in fintech" → {"keywords": "startup fintech", "searchSource": "both", "confidence": 80}

Return only valid JSON with the parsed structure.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this job search query: "${query}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const parsedResult = JSON.parse(data.choices[0].message.content) as ParsedQuery;
    
    console.log('Parsed query result:', parsedResult);

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing search query:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to parse search query',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
