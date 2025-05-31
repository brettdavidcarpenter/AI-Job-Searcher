
import { supabase } from "@/integrations/supabase/client";

export interface JobSearchParams {
  query?: string;
  location?: string;
  keywords?: string;
  remote?: boolean;
  page?: number;
  num_pages?: number;
}

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_employment_type: string;
  job_posted_at_datetime_utc: string;
  job_salary_currency?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_apply_link: string;
  source?: string;
}

export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: any;
  data: JSearchJob[];
  num_pages: number;
}

export const searchJobs = async (params: JobSearchParams): Promise<JSearchResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-jobs', {
      body: params
    });

    if (error) {
      console.error('Error calling search-jobs function:', error);
      throw new Error('Failed to search jobs');
    }

    return data;
  } catch (error) {
    console.error('Error in searchJobs:', error);
    throw error;
  }
};

export const formatSalary = (job: JSearchJob): string => {
  if (job.job_min_salary && job.job_max_salary) {
    const currency = job.job_salary_currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    });
    return `${formatter.format(job.job_min_salary)} - ${formatter.format(job.job_max_salary)}`;
  }
  return 'Salary not specified';
};

export const formatLocation = (job: JSearchJob): string => {
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(', ');
};

export const formatPostedDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  } catch {
    return 'Recently posted';
  }
};
