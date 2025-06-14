
import { supabase } from "@/integrations/supabase/client";

export interface XrayConfig {
  id: string;
  user_id: string;
  name: string;
  query: string;
  is_active: boolean;
  schedule_frequency: 'manual' | 'daily' | 'weekly';
  created_at: string;
  last_run_at?: string;
  next_run_at?: string;
}

export const createXrayConfig = async (config: Omit<XrayConfig, 'id' | 'user_id' | 'created_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create X-ray configs');
  }

  const { data, error } = await supabase
    .from('xray_search_configs')
    .insert({
      user_id: user.id,
      name: config.name,
      query: config.query,
      is_active: config.is_active,
      schedule_frequency: config.schedule_frequency
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating X-ray config:', error);
    throw error;
  }

  return data;
};

export const getXrayConfigs = async (): Promise<XrayConfig[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('xray_search_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching X-ray configs:', error);
    throw error;
  }

  return data || [];
};

export const updateXrayConfig = async (id: string, updates: Partial<XrayConfig>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to update X-ray configs');
  }

  const { data, error } = await supabase
    .from('xray_search_configs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating X-ray config:', error);
    throw error;
  }

  return data;
};

export const deleteXrayConfig = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to delete X-ray configs');
  }

  const { error } = await supabase
    .from('xray_search_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting X-ray config:', error);
    throw error;
  }
};

export const getXrayResults = async (configId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  let query = supabase
    .from('xray_search_results')
    .select('*')
    .eq('user_id', user.id);

  if (configId) {
    query = query.eq('config_id', configId);
  }

  const { data, error } = await query.order('found_at', { ascending: false });

  if (error) {
    console.error('Error fetching X-ray results:', error);
    throw error;
  }

  return data || [];
};
