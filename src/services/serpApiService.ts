
import { supabase } from "@/integrations/supabase/client";

export interface SerpApiJob {
  position: number;
  title: string;
  company_name: string;
  location: string;
  via: string;
  description: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
  };
  related_links?: Array<{
    link: string;
    text: string;
  }>;
  thumbnail?: string;
}

export interface SerpApiResponse {
  jobs_results: SerpApiJob[];
  search_metadata: {
    status: string;
    total_results?: number;
  };
}

const generateJobId = (title: string, company: string, location: string): string => {
  const combined = `${title}-${company}-${location}`.toLowerCase();
  const hash = combined.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `xray-${Math.abs(hash)}-${Date.now()}`;
};

export const executeXraySearch = async (query: string): Promise<SerpApiJob[]> => {
  try {
    console.log('Executing X-ray search with query:', query);
    
    const { data, error } = await supabase.functions.invoke('execute-xray-search', {
      body: { query }
    });

    console.log('Supabase function response:', { data, error });

    if (error) {
      console.error('Error calling execute-xray-search function:', error);
      throw new Error('Failed to execute X-ray search: ' + error.message);
    }

    if (!data) {
      console.warn('No data returned from X-ray search');
      return [];
    }

    // Handle both 'jobs' and 'jobs_results' response formats
    const jobs = data.jobs || data.jobs_results || [];
    console.log('Jobs results received:', jobs.length);
    
    return jobs;
  } catch (error) {
    console.error('Error in executeXraySearch:', error);
    throw error;
  }
};

export const convertSerpJobToJob = (serpJob: SerpApiJob, index: number) => {
  // Generate a consistent job ID using hash of job details
  const jobId = generateJobId(serpJob.title, serpJob.company_name, serpJob.location);
  
  return {
    id: jobId,
    title: serpJob.title,
    company: serpJob.company_name,
    location: serpJob.location || 'Location not specified',
    salary: 'Salary not specified',
    description: serpJob.description,
    type: 'Full-time',
    postedDate: 'Recently posted',
    applyLink: serpJob.related_links?.[0]?.link,
    source: 'xray',
    isSaved: false,
    fitRating: 0
  };
};
