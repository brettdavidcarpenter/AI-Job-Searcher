
import { supabase } from "@/integrations/supabase/client";

export interface SearchConfig {
  id: string;
  user_id: string;
  name: string;
  search_type: 'jsearch' | 'xray';
  query: string;
  location?: string;
  keywords?: string;
  remote_only: boolean;
  is_recurring: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export const createSearchConfig = async (config: Omit<SearchConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create search configs');
  }

  const { data, error } = await supabase
    .from('search_configs')
    .insert({
      user_id: user.id,
      name: config.name,
      search_type: config.search_type,
      query: config.query,
      location: config.location,
      keywords: config.keywords,
      remote_only: config.remote_only,
      is_recurring: config.is_recurring,
      schedule_frequency: config.schedule_frequency,
      is_active: config.is_active,
      last_run_at: config.last_run_at,
      next_run_at: config.next_run_at
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating search config:', error);
    throw error;
  }

  return data as SearchConfig;
};

export const getSearchConfigs = async (): Promise<SearchConfig[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('search_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching search configs:', error);
    throw error;
  }

  return (data || []) as SearchConfig[];
};

export const updateSearchConfig = async (id: string, updates: Partial<SearchConfig>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to update search configs');
  }

  const { data, error } = await supabase
    .from('search_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating search config:', error);
    throw error;
  }

  return data as SearchConfig;
};

export const deleteSearchConfig = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to delete search configs');
  }

  const { error } = await supabase
    .from('search_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting search config:', error);
    throw error;
  }
};
