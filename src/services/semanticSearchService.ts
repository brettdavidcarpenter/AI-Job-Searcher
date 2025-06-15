
import { supabase } from "@/integrations/supabase/client";

export interface SemanticQuery {
  query: string;
}

export interface ParsedSearchQuery {
  jobTitle?: string;
  location?: string;
  keywords?: string;
  remote?: boolean;
  searchSource: 'jsearch' | 'xray' | 'both';
  confidence: number;
}

export const parseSemanticQuery = async (query: string): Promise<ParsedSearchQuery> => {
  try {
    const { data, error } = await supabase.functions.invoke('parse-search-query', {
      body: { query }
    });

    if (error) {
      console.error('Error parsing semantic query:', error);
      throw error;
    }

    return data as ParsedSearchQuery;
  } catch (error) {
    console.error('Error in parseSemanticQuery:', error);
    // Fallback parsing
    return {
      keywords: query,
      searchSource: 'jsearch',
      confidence: 50
    };
  }
};

export const executeSemanticSearch = async (parsedQuery: ParsedSearchQuery) => {
  // This will be used to route to different search sources based on AI analysis
  const { searchSource, jobTitle, location, keywords, remote } = parsedQuery;
  
  // For now, we'll use the existing job search service
  // In future phases, we can add routing logic for X-ray vs JSearch
  return {
    searchTerm: jobTitle || '',
    location: location || '',
    keywords: keywords || '',
    remote: remote || false,
    source: searchSource
  };
};
