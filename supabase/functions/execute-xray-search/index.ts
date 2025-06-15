
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to extract meaningful search terms from X-ray query
const extractSearchTerms = (query: string) => {
  // Extract quoted terms (job titles, skills)
  const quotedTerms = query.match(/"([^"]+)"/g)?.map(term => term.replace(/"/g, '')) || [];
  
  // Extract keywords from parentheses groups
  const keywordGroups = query.match(/\([^)]+\)/g) || [];
  const keywords: string[] = [];
  
  keywordGroups.forEach(group => {
    // Skip site: groups
    if (!group.includes('site:')) {
      const terms = group.replace(/[()]/g, '').split(/\s+OR\s+/);
      terms.forEach(term => {
        const cleanTerm = term.replace(/"/g, '').trim();
        if (cleanTerm && !cleanTerm.includes('site:')) {
          keywords.push(cleanTerm);
        }
      });
    }
  });
  
  return { quotedTerms, keywords };
};

// Function to create simplified query for Google Jobs
const createSimplifiedQuery = (originalQuery: string): string => {
  console.log('Creating simplified query from:', originalQuery);
  
  const { quotedTerms, keywords } = extractSearchTerms(originalQuery);
  
  console.log('Extracted quoted terms:', quotedTerms);
  console.log('Extracted keywords:', keywords);
  
  // Build simplified query
  const queryParts: string[] = [];
  
  // Add quoted terms (job titles)
  quotedTerms.forEach(term => {
    queryParts.push(`"${term}"`);
  });
  
  // Add important keywords (limit to most relevant)
  const priorityKeywords = keywords.filter(keyword => 
    ['remote', 'ai', 'artificial intelligence', 'machine learning', 'ml', 'data', 'work from home']
    .some(priority => keyword.toLowerCase().includes(priority.toLowerCase()))
  );
  
  priorityKeywords.slice(0, 3).forEach(keyword => {
    if (!keyword.includes('work-from-home')) { // Skip hyphenated versions
      queryParts.push(keyword);
    }
  });
  
  const simplifiedQuery = queryParts.join(' ');
  console.log('Simplified query:', simplifiedQuery);
  
  return simplifiedQuery;
};

// Function to test API connectivity with simple query
const testApiConnectivity = async (serpApiKey: string) => {
  console.log('Testing API connectivity with simple query...');
  
  const testParams = new URLSearchParams({
    engine: 'google_jobs',
    q: 'product manager',
    api_key: serpApiKey,
    num: '5'
  });
  
  try {
    const response = await fetch(`https://serpapi.com/search.json?${testParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)'
      }
    });
    
    console.log('Test query response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Test query success - jobs found:', data.jobs_results?.length || 0);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log('Test query failed:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('Test query error:', error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY')
    
    if (!serpApiKey) {
      return new Response(
        JSON.stringify({ error: 'SERPAPI_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== X-ray Search Debug Session ===');
    console.log('Original X-ray query:', query);

    // Step 1: Test API connectivity
    const connectivityTest = await testApiConnectivity(serpApiKey);
    if (!connectivityTest.success) {
      console.log('API connectivity test failed, aborting');
      return new Response(
        JSON.stringify({ 
          error: 'API connectivity test failed',
          details: connectivityTest.error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Create simplified query
    const simplifiedQuery = createSimplifiedQuery(query);
    
    // Step 3: Try multiple query approaches
    const queryAttempts = [
      {
        name: 'Simplified Query (No Date Filter)',
        query: simplifiedQuery,
        chips: undefined
      },
      {
        name: 'Simplified Query (Past Week)',
        query: simplifiedQuery,
        chips: 'date_posted:week'
      },
      {
        name: 'Simplified Query (Past Month)',
        query: simplifiedQuery,
        chips: 'date_posted:month'
      }
    ];

    let bestResult = null;
    let bestResultCount = 0;

    for (const attempt of queryAttempts) {
      console.log(`\n--- Trying: ${attempt.name} ---`);
      console.log('Query:', attempt.query);
      console.log('Date filter:', attempt.chips || 'None');
      
      const params = new URLSearchParams({
        engine: 'google_jobs',
        q: attempt.query,
        api_key: serpApiKey,
        num: '10'
      });

      if (attempt.chips) {
        params.append('chips', attempt.chips);
      }

      console.log('Full request URL:', `https://serpapi.com/search.json?${params}`);

      try {
        const response = await fetch(`https://serpapi.com/search.json?${params}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)'
          }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Response keys:', Object.keys(data));
          
          const jobCount = data.jobs_results?.length || 0;
          console.log('Jobs found:', jobCount);
          
          if (data.error) {
            console.log('API Error:', data.error);
          }
          
          if (jobCount > bestResultCount) {
            bestResult = data;
            bestResultCount = jobCount;
            console.log(`✓ Best result so far: ${jobCount} jobs with ${attempt.name}`);
          }
          
          // If we found jobs, we can stop here
          if (jobCount > 0) {
            console.log(`✓ Success with ${attempt.name}! Found ${jobCount} jobs`);
            break;
          }
        } else {
          const errorText = await response.text();
          console.log('Request failed:', errorText);
        }
      } catch (error) {
        console.log('Request error:', error.message);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Return the best result we found
    if (bestResult) {
      console.log(`\n=== Final Result: ${bestResultCount} jobs found ===`);
      
      if (bestResult.jobs_results && bestResult.jobs_results.length > 0) {
        console.log('Sample job title:', bestResult.jobs_results[0].title);
        console.log('Sample company:', bestResult.jobs_results[0].company_name);
      }
      
      return new Response(
        JSON.stringify(bestResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('\n=== No jobs found with any query approach ===');
      return new Response(
        JSON.stringify({ 
          error: 'No jobs found with any query variation',
          debug_info: {
            original_query: query,
            simplified_query: simplifiedQuery,
            attempts_made: queryAttempts.length,
            api_connectivity: 'OK'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
