import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Play, Settings, Plus, Copy, Sparkles, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createSearchConfig, getSearchConfigs, updateSearchConfig, deleteSearchConfig, type SearchConfig } from "@/services/searchConfigService";
import { storePendingReviews } from "@/services/pendingReviewsService";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

interface SearchSetupProps {
  user: User | null;
  onJobsFound: (jobs: Job[]) => void;
}

const XRAY_EXAMPLES = [
  {
    title: "LinkedIn Software Engineer Jobs",
    query: 'site:linkedin.com/jobs "software engineer" "San Francisco"',
    description: "Find software engineer positions in San Francisco on LinkedIn"
  },
  {
    title: "Remote Product Manager Roles",
    query: 'site:indeed.com "product manager" AND "remote"',
    description: "Search for remote product manager positions on Indeed"
  },
  {
    title: "Data Science in Healthcare",
    query: 'site:glassdoor.com "data scientist" "healthcare" OR "biotech"',
    description: "Find data science roles in healthcare/biotech on Glassdoor"
  },
  {
    title: "Startup Jobs Multiple Sites",
    query: '(site:linkedin.com/jobs OR site:indeed.com) "startup" "engineer"',
    description: "Search for engineering roles at startups across multiple job sites"
  }
];

const STANDARD_EXAMPLES = [
  "AI product manager remote positions",
  "Software engineer at tech startups in SF", 
  "Senior data scientist healthcare industry",
  "Remote UX designer fintech companies",
  "DevOps engineer with AWS experience"
];

export const SearchSetup = ({ user, onJobsFound }: SearchSetupProps) => {
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SearchConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'standard' | 'xray'>('standard');

  const [standardFormData, setStandardFormData] = useState({
    name: '',
    natural_query: '',
    remote_only: false,
    is_recurring: false,
    schedule_frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    is_active: true
  });

  const [xrayFormData, setXrayFormData] = useState({
    name: '',
    xray_query: '',
    is_recurring: false,
    schedule_frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      loadConfigs();
    }
  }, [user]);

  const loadConfigs = async () => {
    try {
      const data = await getSearchConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading search configs:', error);
    }
  };

  const resetForm = () => {
    setStandardFormData({
      name: '',
      natural_query: '',
      remote_only: false,
      is_recurring: false,
      schedule_frequency: 'daily',
      is_active: true
    });
    setXrayFormData({
      name: '',
      xray_query: '',
      is_recurring: false,
      schedule_frequency: 'daily',
      is_active: true
    });
    setEditingConfig(null);
    setShowForm(false);
    setSearchType('standard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save search configurations",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let configData;
      
      if (searchType === 'standard') {
        configData = {
          name: standardFormData.name,
          search_type: 'jsearch' as const,
          query: standardFormData.natural_query,
          location: '',
          keywords: '',
          remote_only: standardFormData.remote_only,
          is_recurring: standardFormData.is_recurring,
          schedule_frequency: standardFormData.schedule_frequency,
          is_active: standardFormData.is_active
        };
      } else {
        configData = {
          name: xrayFormData.name,
          search_type: 'xray' as const,
          query: xrayFormData.xray_query,
          location: '',
          keywords: '',
          remote_only: false,
          is_recurring: xrayFormData.is_recurring,
          schedule_frequency: xrayFormData.schedule_frequency,
          is_active: xrayFormData.is_active
        };
      }

      if (editingConfig) {
        await updateSearchConfig(editingConfig.id, configData);
        toast({
          title: "Search updated",
          description: "Your search configuration has been updated successfully",
        });
      } else {
        await createSearchConfig(configData);
        toast({
          title: "Search created",
          description: "Your search configuration has been saved successfully",
        });
      }
      
      await loadConfigs();
      resetForm();
    } catch (error) {
      console.error('Error saving search config:', error);
      toast({
        title: "Error",
        description: "Failed to save search configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (config: SearchConfig) => {
    if (config.search_type === 'xray') {
      setSearchType('xray');
      setXrayFormData({
        name: config.name,
        xray_query: config.query,
        is_recurring: config.is_recurring,
        schedule_frequency: config.schedule_frequency || 'daily',
        is_active: config.is_active
      });
    } else {
      setSearchType('standard');
      setStandardFormData({
        name: config.name,
        natural_query: config.query,
        remote_only: config.remote_only,
        is_recurring: config.is_recurring,
        schedule_frequency: config.schedule_frequency || 'daily',
        is_active: config.is_active
      });
    }
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (configId: string) => {
    try {
      await deleteSearchConfig(configId);
      await loadConfigs();
      toast({
        title: "Search deleted",
        description: "Search configuration has been deleted",
      });
    } catch (error) {
      console.error('Error deleting search config:', error);
      toast({
        title: "Error",
        description: "Failed to delete search configuration",
        variant: "destructive",
      });
    }
  };

  const handleTestSearch = async (config: SearchConfig) => {
    if (!user) return;
    
    setTestingConfig(config.id);
    try {
      let data, error;

      if (config.search_type === 'xray') {
        const response = await supabase.functions.invoke('execute-xray-search', {
          body: { query: config.query }
        });
        data = response.data;
        error = response.error;
      } else {
        const response = await supabase.functions.invoke('search-jobs', {
          body: {
            query: config.query,
            location: config.location || '',
            keywords: config.keywords || '',
            remote: config.remote_only
          }
        });
        data = response.data;
        error = response.error;
      }

      if (error) {
        console.error('Search function error:', error);
        throw new Error(error.message || 'Search failed');
      }

      if (!data) {
        throw new Error('No response data received');
      }

      // Handle different response formats
      const jobs = data.jobs || data.jobs_results || [];
      
      if (jobs.length > 0) {
        // Store in pending reviews with proper source type
        await storePendingReviews(jobs, config.id, config.search_type);
        
        // Also show in current tab for immediate viewing
        onJobsFound(jobs);
        
        // Enhanced success message with navigation guidance
        toast({
          title: "🎉 Test search successful!",
          description: `Found ${jobs.length} jobs and added them to Review Queue. Switch to the Review Queue tab to save your favorites.`,
          duration: 6000,
        });
      } else {
        // Handle no results case
        const userMessage = data.userMessage || "No jobs found for your search criteria.";
        const suggestion = data.debug_info?.suggestion || "Try adjusting your search query or expanding your criteria.";
        
        toast({
          title: "No jobs found",
          description: `${userMessage} ${suggestion}`,
          variant: "default",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error testing search:', error);
      
      // Provide specific error feedback based on error type
      let errorMessage = "Search test failed. Please try again.";
      let errorDescription = "Unknown error occurred.";
      
      if (error.message) {
        if (error.message.includes('API connectivity failed')) {
          errorMessage = "API Connection Failed";
          errorDescription = "Unable to connect to search service. Please check your API key configuration.";
        } else if (error.message.includes('No job postings found')) {
          errorMessage = "No Jobs Found";
          errorDescription = "Try a broader search or include specific job sites in your X-ray query.";
        } else if (error.message.includes('Network error')) {
          errorMessage = "Network Error";
          errorDescription = "Please check your internet connection and try again.";
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setTestingConfig(null);
    }
  };

  const toggleActive = async (config: SearchConfig) => {
    try {
      await updateSearchConfig(config.id, { is_active: !config.is_active });
      await loadConfigs();
      toast({
        title: config.is_active ? "Search deactivated" : "Search activated",
        description: `${config.name} has been ${config.is_active ? 'deactivated' : 'activated'}`,
      });
    } catch (error) {
      console.error('Error toggling search status:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Query copied to clipboard",
    });
  };

  const isXrayQueryValid = (query: string) => {
    const hasSiteOperator = query.includes('site:');
    const hasValidSites = /site:(linkedin\.com|indeed\.com|glassdoor\.com|monster\.com|ziprecruiter\.com|simplyhired\.com|careerbuilder\.com|jobvite\.com|lever\.co|greenhouse\.io|workday\.com|icims\.com|ashbyhq\.com|bamboohr\.com|dover\.com|jazz\.co|workable\.com|gem\.com|breezy\.hr)/i.test(query);
    return hasSiteOperator && hasValidSites && query.trim().length > 0;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Sign in to set up searches</h3>
        <p className="text-gray-500">Create automated job searches and get notified when new opportunities are found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Search Setup</h2>
          <p className="text-gray-600">Configure automated job searches to find opportunities while you sleep</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Search
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingConfig ? 'Edit Search' : 'Create New Search'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={searchType} onValueChange={(value: 'standard' | 'xray') => setSearchType(value)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Standard Search
                </TabsTrigger>
                <TabsTrigger value="xray" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  X-ray Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Standard Search</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Use natural language to describe what you're looking for. Our AI will parse your request and search using the JSearch API.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-800">Examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_EXAMPLES.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setStandardFormData(prev => ({ ...prev, natural_query: example }))}
                          className="text-xs bg-white hover:bg-blue-100"
                        >
                          {example}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="standard-name">Search Name</Label>
                    <Input
                      id="standard-name"
                      value={standardFormData.name}
                      onChange={(e) => setStandardFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., AI Product Manager Remote Jobs"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="natural-query">Describe what you're looking for</Label>
                    <Input
                      id="natural-query"
                      value={standardFormData.natural_query}
                      onChange={(e) => setStandardFormData(prev => ({ ...prev, natural_query: e.target.value }))}
                      placeholder="e.g., AI product manager remote positions"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="standard-remote"
                      checked={standardFormData.remote_only}
                      onCheckedChange={(checked) => setStandardFormData(prev => ({ ...prev, remote_only: checked }))}
                    />
                    <Label htmlFor="standard-remote">Remote only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="standard-recurring"
                      checked={standardFormData.is_recurring}
                      onCheckedChange={(checked) => setStandardFormData(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <Label htmlFor="standard-recurring">Recurring search</Label>
                  </div>

                  {standardFormData.is_recurring && (
                    <div>
                      <Label htmlFor="standard-frequency">Frequency</Label>
                      <Select 
                        value={standardFormData.schedule_frequency} 
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          setStandardFormData(prev => ({ ...prev, schedule_frequency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingConfig ? 'Update Search' : 'Create Search'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="xray" className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-purple-900 mb-2">X-ray Search</h4>
                  <p className="text-purple-700 text-sm mb-3">
                    Paste pre-formatted X-ray search queries. These will be executed directly using SerpAPI for advanced Google search operators.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-purple-800">Example queries:</p>
                    {XRAY_EXAMPLES.map((example, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-sm">{example.title}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(example.query)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <code className="text-xs bg-gray-100 p-1 rounded block mb-1">{example.query}</code>
                        <p className="text-xs text-gray-600">{example.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="xray-name">Search Name</Label>
                    <Input
                      id="xray-name"
                      value={xrayFormData.name}
                      onChange={(e) => setXrayFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., LinkedIn AI Engineers SF"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="xray-query">X-ray Query</Label>
                    <Textarea
                      id="xray-query"
                      value={xrayFormData.xray_query}
                      onChange={(e) => setXrayFormData(prev => ({ ...prev, xray_query: e.target.value }))}
                      placeholder='site:linkedin.com/jobs "software engineer" "San Francisco"'
                      className="h-24 font-mono text-sm"
                      required
                    />
                    {xrayFormData.xray_query && !isXrayQueryValid(xrayFormData.xray_query) && (
                      <p className="text-sm text-red-600 mt-1">
                        Query must contain site: operator (e.g., site:linkedin.com/jobs)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="xray-recurring"
                      checked={xrayFormData.is_recurring}
                      onCheckedChange={(checked) => setXrayFormData(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <Label htmlFor="xray-recurring">Recurring search</Label>
                  </div>

                  {xrayFormData.is_recurring && (
                    <div>
                      <Label htmlFor="xray-frequency">Frequency</Label>
                      <Select 
                        value={xrayFormData.schedule_frequency} 
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          setXrayFormData(prev => ({ ...prev, schedule_frequency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || (searchType === 'xray' && !isXrayQueryValid(xrayFormData.xray_query))}
                    >
                      {isLoading ? 'Saving...' : editingConfig ? 'Update Search' : 'Create Search'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No searches configured</h3>
            <p className="text-gray-500">Create your first automated search to get started</p>
          </div>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{config.name}</h3>
                      <Badge variant={config.search_type === 'jsearch' ? 'default' : 'secondary'}>
                        {config.search_type === 'jsearch' ? 'Standard' : 'X-ray'}
                      </Badge>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {config.is_recurring && (
                        <Badge variant="outline">{config.schedule_frequency}</Badge>
                      )}
                    </div>
                    <div className="mb-2">
                      <p className="text-gray-600">
                        <strong>Query:</strong> {config.query}
                      </p>
                      {config.search_type === 'jsearch' && (
                        <>
                          {config.location && <p className="text-gray-600"><strong>Location:</strong> {config.location}</p>}
                          {config.keywords && <p className="text-gray-600"><strong>Keywords:</strong> {config.keywords}</p>}
                          {config.remote_only && <p className="text-gray-600"><strong>Remote only</strong></p>}
                        </>
                      )}
                    </div>
                    {config.last_run_at && (
                      <p className="text-sm text-gray-500">
                        Last run: {new Date(config.last_run_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSearch(config)}
                      disabled={testingConfig === config.id}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {testingConfig === config.id ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(config)}
                    >
                      {config.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
