
-- Remove the fallback_jobs table as it's no longer needed
-- We're now using the last_successful_search strategy instead
DROP TABLE IF EXISTS public.fallback_jobs;
