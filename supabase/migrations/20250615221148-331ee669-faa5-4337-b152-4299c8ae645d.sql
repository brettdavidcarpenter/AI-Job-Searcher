
-- Create API key health tracking table
CREATE TABLE public.api_key_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  last_success TIMESTAMP WITH TIME ZONE,
  last_failure TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  rate_limited_until TIMESTAMP WITH TIME ZONE,
  total_requests_today INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_api_key_health_key_name ON public.api_key_health(key_name);
CREATE INDEX idx_api_key_health_rate_limited ON public.api_key_health(rate_limited_until);

-- Add request tracking to cached searches
ALTER TABLE public.cached_job_searches 
ADD COLUMN api_key_used TEXT,
ADD COLUMN request_duration_ms INTEGER;

-- Enable RLS on api_key_health table (admin only access)
ALTER TABLE public.api_key_health ENABLE ROW LEVEL SECURITY;

-- Create policy for system access only (no user access needed)
CREATE POLICY "System access only" ON public.api_key_health
FOR ALL USING (false);
