
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to extract job-related URLs from Google search results
const extractJobUrls = (organicResults: any[]): any[] => {
  if (!organicResults) return [];
  
  const jobSites = [
    'linkedin.com/jobs',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'ziprecruiter.com',
    'simplyhired.com',
    'careerbuilder.com',
    'jobvite.com',
    'lever.co',
    'greenhouse.io',
    'workday.com',
    'icims.com'
  ];
  
  return organicResults.filter(result => {
    const link = result.link?.toLowerCase() || '';
    return jobSites.some(site => link.includes(site));
  }).map((result, index) => ({
    position: index + 1,
    title: result.title || 'Job Title Not Available',
    company_name: extractCompanyFromResult(result),
    location: extractLocationFromResult(result),
    via: result.displayed_link || new URL(result.link).hostname,
    description: result.snippet || 'No description available',
    job_highlights: {
      Responsibilities: result.snippet ? [result.snippet] : []
    },
    related_links: [{
      link: result.link,
      text: 'Apply Now'
    }],
    thumbnail: result.thumbnail
  }));
};

// Extract company name from search result
const extractCompanyFromResult = (result: any): string => {
  const title = result.title || '';
  const snippet = result.snippet || '';
  const displayedLink = result.displayed_link || '';
  
  // Try to extract from title (common patterns)
  const titleMatch = title.match(/at\s+([^-|]+)/i) || 
                    title.match(/\|\s*([^-|]+)$/i) ||
                    title.match(/-\s*([^-|]+)$/i);
  
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Try to extract from displayed link
  if (displayedLink.includes('linkedin.com')) {
    const companyMatch = displayedLink.match(/company\/([^\/]+)/);
    if (companyMatch) {
      return companyMatch[1].replace(/-/g, ' ');
    }
  }
  
  // Default to domain name
  try {
    const domain = new URL(result.link).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Company Not Specified';
  }
};

// Extract location from search result
const extractLocationFromResult = (result: any): string => {
  const snippet = result.snippet || '';
  const title = result.title || '';
  
  // Common location patterns
  const locationPatterns = [
    /\b([A-Z][a-z]+,?\s+[A-Z]{2})\b/, // City, ST
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+,?\s+[A-Z]{2})\b/, // City Name, ST
    /Remote/i,
    /Work from home/i,
    /Hybrid/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern) || title.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'Location not specified';
};

// Function to test API connectivity with simple query
const testApiConnectivity = async (serpApiKey: string) => {
  console.log('Testing API connectivity with simple Google search...');
  
  const testParams = new URLSearchParams({
    engine: 'google',
    q: 'site:linkedin.com/jobs "product manager"',
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
      console.log('Test query success - organic results found:', data.organic_results?.length || 0);
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

    console.log('=== X-ray Search Debug Session (Google Search) ===');
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

    // Step 2: Try multiple query approaches with Google Search
    const queryAttempts = [
      {
        name: 'Original X-ray Query',
        query: query,
        tbm: undefined,
        tbs: undefined
      },
      {
        name: 'X-ray Query (Past Week)',
        query: query,
        tbm: undefined,
        tbs: 'qdr:w'
      },
      {
        name: 'X-ray Query (Past Month)',
        query: query,
        tbm: undefined,
        tbs: 'qdr:m'
      }
    ];

    let bestResult = null;
    let bestResultCount = 0;

    for (const attempt of queryAttempts) {
      console.log(`\n--- Trying: ${attempt.name} ---`);
      console.log('Query:', attempt.query);
      console.log('Date filter:', attempt.tbs || 'None');
      
      const params = new URLSearchParams({
        engine: 'google',
        q: attempt.query,
        api_key: serpApiKey,
        num: '20' // Get more results since we'll filter for job sites
      });

      if (attempt.tbs) {
        params.append('tbs', attempt.tbs);
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
          
          const organicCount = data.organic_results?.length || 0;
          console.log('Organic results found:', organicCount);
          
          if (data.error) {
            console.log('API Error:', data.error);
          }
          
          // Extract job-related results
          const jobResults = extractJobUrls(data.organic_results || []);
          const jobCount = jobResults.length;
          console.log('Job-related results extracted:', jobCount);
          
          if (jobCount > bestResultCount) {
            // Transform the data to match the expected jobs_results format
            bestResult = {
              ...data,
              jobs_results: jobResults,
              search_metadata: data.search_metadata
            };
            bestResultCount = jobCount;
            console.log(`✓ Best result so far: ${jobCount} job results with ${attempt.name}`);
          }
          
          // If we found jobs, we can stop here
          if (jobCount > 0) {
            console.log(`✓ Success with ${attempt.name}! Found ${jobCount} job results`);
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
      console.log(`\n=== Final Result: ${bestResultCount} job results found ===`);
      
      if (bestResult.jobs_results && bestResult.jobs_results.length > 0) {
        console.log('Sample job title:', bestResult.jobs_results[0].title);
        console.log('Sample company:', bestResult.jobs_results[0].company_name);
        console.log('Sample URL:', bestResult.jobs_results[0].related_links?.[0]?.link);
      }
      
      return new Response(
        JSON.stringify(bestResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('\n=== No job results found with any query approach ===');
      return new Response(
        JSON.stringify({ 
          error: 'No job-related results found with any query variation',
          debug_info: {
            original_query: query,
            attempts_made: queryAttempts.length,
            api_connectivity: 'OK',
            engine_used: 'google'
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
