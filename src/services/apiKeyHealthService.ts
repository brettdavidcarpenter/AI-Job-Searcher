
import { supabase } from "@/integrations/supabase/client";

export interface ApiKeyHealthData {
  id: string;
  key_name: string;
  last_success?: string;
  last_failure?: string;
  consecutive_failures: number;
  rate_limited_until?: string;
  total_requests_today: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export const getApiKeyHealthStatus = async (): Promise<ApiKeyHealthData[]> => {
  try {
    const { data, error } = await supabase
      .from('api_key_health')
      .select('*')
      .order('key_name');

    if (error) {
      console.error('Error fetching API key health:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getApiKeyHealthStatus:', error);
    throw error;
  }
};

export const isKeyCurrentlyHealthy = (keyHealth: ApiKeyHealthData): boolean => {
  // Check if rate limited
  if (keyHealth.rate_limited_until) {
    const rateLimitExpiry = new Date(keyHealth.rate_limited_until);
    if (new Date() < rateLimitExpiry) {
      return false;
    }
  }

  // Check consecutive failures
  if (keyHealth.consecutive_failures >= 5) {
    return false;
  }

  // Check success rate
  if (keyHealth.success_rate < 50) {
    return false;
  }

  return true;
};

export const getHealthStatusSummary = (healthData: ApiKeyHealthData[]) => {
  const summary = {
    totalKeys: healthData.length,
    healthyKeys: 0,
    rateLimitedKeys: 0,
    failedKeys: 0,
    totalRequestsToday: 0,
    averageSuccessRate: 0
  };

  let totalSuccessRate = 0;

  healthData.forEach(key => {
    summary.totalRequestsToday += key.total_requests_today;
    totalSuccessRate += key.success_rate;

    if (isKeyCurrentlyHealthy(key)) {
      summary.healthyKeys++;
    } else if (key.rate_limited_until && new Date(key.rate_limited_until) > new Date()) {
      summary.rateLimitedKeys++;
    } else {
      summary.failedKeys++;
    }
  });

  summary.averageSuccessRate = healthData.length > 0 ? totalSuccessRate / healthData.length : 0;

  return summary;
};
