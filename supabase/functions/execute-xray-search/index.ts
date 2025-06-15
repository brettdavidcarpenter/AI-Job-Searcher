
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
    'icims.com',
    'ashbyhq.com',
    'boards.greenhouse.io',
    'jobs.lever.co',
    'jobs.smartrecruiters.com',
    'jobs.bamboohr.com',
    'jobs.jobvite.com',
    'app.dover.com',
    'careers.icims.com',
    'apply.jazz.co',
    'apply.workable.com',
    'jobs.gem.com',
    'breezy.hr'
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

// Function to test API connectivity
const testApiConnectivity = async (serpApiKey: string) => {
  console.log('🔍 Testing SerpAPI connectivity...');
  
  const testParams = new URLSearchParams({
    engine: 'google',
    q: 'test query',
    api_key: serpApiKey,
    num: '3'
  });
  
  try {
    const response = await fetch(`https://serpapi.com/search.json?${testParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XraySearchBot/1.0)'
      }
    });
    
    console.log('✅ API connectivity test - Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connectivity test passed');
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log('❌ API connectivity test failed:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('❌ API connectivity test error:', error);
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

    console.log('=== X-RAY SEARCH DEBUG SESSION ===');
    console.log('🎯 Original X-ray query:', query);
    console.log('🔧 Engine: Google Search (NOT Google Jobs)');
    console.log('📅 Timestamp:', new Date().toISOString());

    // Step 1: Test API connectivity
    const connectivityTest = await testApiConnectivity(serpApiKey);
    if (!connectivityTest.success) {
      console.log('❌ API connectivity test failed, aborting search');
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

    // Step 2: Execute the ORIGINAL X-ray query without modification
    console.log('\n🚀 Executing X-ray search with ORIGINAL query (no modifications)');
    console.log('📝 Query being sent to SerpAPI:', query);
    
    const searchParams = new URLSearchParams({
      engine: 'google',
      q: query,
      api_key: serpApiKey,
      num: '20', // Get more results since we'll filter for job sites
      safe: 'off' // Ensure no filtering
    });

    const fullUrl = `https://serpapi.com/search.json?${searchParams}`;
    console.log('🌐 Full SerpAPI URL:', fullUrl.replace(serpApiKey, 'HIDDEN_API_KEY'));

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; XraySearchBot/1.0)'
        }
      });

      console.log('📡 SerpAPI Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Response Data Keys:', Object.keys(data));
        
        if (data.error) {
          console.log('⚠️ SerpAPI Error:', data.error);
          return new Response(
            JSON.stringify({ 
              error: 'SerpAPI Error: ' + data.error,
              debug_info: {
                original_query: query,
                engine_used: 'google',
                api_response_keys: Object.keys(data)
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const organicCount = data.organic_results?.length || 0;
        console.log('🔍 Total organic results found:', organicCount);
        
        if (organicCount > 0) {
          console.log('📋 Sample results:');
          data.organic_results.slice(0, 3).forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.title} - ${result.link}`);
          });
        }
        
        // Extract job-related results
        const jobResults = extractJobUrls(data.organic_results || []);
        const jobCount = jobResults.length;
        console.log('💼 Job-related results extracted:', jobCount);
        
        if (jobCount > 0) {
          console.log('🎯 Job results sample:');
          jobResults.slice(0, 3).forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} at ${job.company_name} - ${job.related_links[0]?.link}`);
          });
          
          // Transform the data to match the expected jobs_results format
          const resultData = {
            ...data,
            jobs_results: jobResults,
            search_metadata: {
              ...data.search_metadata,
              engine_used: 'google_search',
              original_query: query,
              job_results_extracted: jobCount,
              total_organic_results: organicCount
            }
          };
          
          console.log('✅ SUCCESS: Returning', jobCount, 'job results from X-ray search');
          
          return new Response(
            JSON.stringify(resultData),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          console.log('ℹ️ No job-related results found in organic results');
          console.log('🔍 This could mean:');
          console.log('   1. The X-ray query is too specific');
          console.log('   2. No job sites match the query criteria');
          console.log('   3. The query syntax needs adjustment');
          
          return new Response(
            JSON.stringify({ 
              error: 'No job-related results found',
              debug_info: {
                original_query: query,
                engine_used: 'google_search',
                total_organic_results: organicCount,
                organic_results_sample: data.organic_results?.slice(0, 5).map(r => ({
                  title: r.title,
                  link: r.link
                })) || [],
                suggestion: 'Try a broader X-ray query or check the syntax'
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } else {
        const errorText = await response.text();
        console.log('❌ SerpAPI Request failed with status:', response.status);
        console.log('❌ Error response:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `SerpAPI request failed with status ${response.status}`,
            details: errorText,
            debug_info: {
              original_query: query,
              engine_used: 'google_search',
              api_status: response.status
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } catch (error) {
      console.log('❌ Request error:', error.message);
      console.log('❌ Full error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Network or request error: ' + error.message,
          debug_info: {
            original_query: query,
            engine_used: 'google_search',
            error_type: 'network_error'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('💥 Edge function error:', error);
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
