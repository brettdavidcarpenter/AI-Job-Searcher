
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/pages/Index";

export interface XrayResult {
  id: string;
  user_id: string;
  config_id: string;
  job_id: string;
  job_title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  job_type?: string;
  posted_date?: string;
  apply_link?: string;
  source: string;
  found_at: string;
}

export const storeXrayResults = async (configId: string, jobs: Job[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to store X-ray results');
  }

  // Convert jobs to X-ray result format
  const xrayResults = jobs.map(job => ({
    user_id: user.id,
    config_id: configId,
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    description: job.description,
    job_type: job.type,
    posted_date: job.postedDate,
    apply_link: job.applyLink,
    source: 'xray'
  }));

  // Insert results into database, handling duplicates
  const { data, error } = await supabase
    .from('xray_search_results')
    .upsert(xrayResults, {
      onConflict: 'user_id,job_id',
      ignoreDuplicates: true
    })
    .select();

  if (error) {
    console.error('Error storing X-ray results:', error);
    throw error;
  }

  return data;
};

export const getXrayResultsByConfig = async (configId: string): Promise<XrayResult[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('xray_search_results')
    .select('*')
    .eq('user_id', user.id)
    .eq('config_id', configId)
    .order('found_at', { ascending: false })
    .limit(20); // Limit to most recent 20 results per config

  if (error) {
    console.error('Error fetching X-ray results:', error);
    throw error;
  }

  return (data || []) as XrayResult[];
};

export const getAllXrayResults = async (): Promise<XrayResult[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('xray_search_results')
    .select('*')
    .eq('user_id', user.id)
    .order('found_at', { ascending: false });

  if (error) {
    console.error('Error fetching all X-ray results:', error);
    throw error;
  }

  return (data || []) as XrayResult[];
};

export const convertXrayResultToJob = (xrayResult: XrayResult): Job => {
  return {
    id: xrayResult.job_id,
    title: xrayResult.job_title,
    company: xrayResult.company,
    location: xrayResult.location || '',
    salary: xrayResult.salary || '',
    description: xrayResult.description || '',
    type: xrayResult.job_type || 'Full-time',
    postedDate: xrayResult.posted_date || '',
    applyLink: xrayResult.apply_link || '',
    source: 'xray',
    isSaved: false,
    fitRating: 0
  };
};
