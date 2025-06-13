
-- Create table for storing the most recent successful search results globally
CREATE TABLE public.last_successful_search (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_results JSONB NOT NULL,
  search_params JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  result_count INTEGER NOT NULL DEFAULT 0
);

-- Create index for efficient lookups
CREATE INDEX idx_last_successful_search_cached_at ON public.last_successful_search(cached_at DESC);

-- Insert a cleanup function to keep only the most recent successful search
CREATE OR REPLACE FUNCTION cleanup_last_successful_search()
RETURNS void AS $$
BEGIN
  -- Keep only the most recent 5 successful searches
  DELETE FROM public.last_successful_search 
  WHERE id NOT IN (
    SELECT id FROM public.last_successful_search 
    ORDER BY cached_at DESC 
    LIMIT 5
  );
END;
$$ LANGUAGE plpgsql;

-- Add result metadata columns to cached_job_searches for better tracking
ALTER TABLE public.cached_job_searches 
ADD COLUMN IF NOT EXISTS result_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS search_source TEXT DEFAULT 'api';
