
import type { JSearchJob } from "@/services/jobSearchService";
import type { Job } from "@/pages/Index";

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

export const convertJSearchJobToJob = (jsearchJob: JSearchJob): Job => {
  return {
    id: jsearchJob.job_id,
    title: jsearchJob.job_title,
    company: jsearchJob.employer_name,
    location: formatLocation(jsearchJob),
    salary: formatSalary(jsearchJob),
    description: jsearchJob.job_description,
    type: jsearchJob.job_employment_type || 'Full-time',
    postedDate: formatPostedDate(jsearchJob.job_posted_at_datetime_utc),
    applyLink: jsearchJob.job_apply_link,
    isSaved: false,
    fitRating: 0,
    source: jsearchJob.source
  };
};
