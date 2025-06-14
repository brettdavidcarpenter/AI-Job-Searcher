
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

export const executeXraySearch = async (query: string): Promise<SerpApiJob[]> => {
  try {
    // Add 24-hour time constraint automatically
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateConstraint = `after:${yesterday.toISOString().split('T')[0]}`;
    
    // Combine user query with time constraint
    const enhancedQuery = `${query} ${dateConstraint}`;
    
    const { data, error } = await supabase.functions.invoke('execute-xray-search', {
      body: { query: enhancedQuery }
    });

    if (error) {
      console.error('Error calling execute-xray-search function:', error);
      throw new Error('Failed to execute X-ray search: ' + error.message);
    }

    return data?.jobs_results || [];
  } catch (error) {
    console.error('Error in executeXraySearch:', error);
    throw error;
  }
};

export const convertSerpJobToJob = (serpJob: SerpApiJob, index: number) => {
  return {
    id: `xray-${Date.now()}-${index}`,
    title: serpJob.title,
    company: serpJob.company_name,
    location: serpJob.location || 'Location not specified',
    salary: 'Salary not specified',
    description: serpJob.description,
    type: 'Full-time',
    postedDate: 'Recently posted',
    applyLink: serpJob.related_links?.[0]?.link,
    source: 'X-ray',
    isSaved: false,
    fitRating: 0
  };
};
