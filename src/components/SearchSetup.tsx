
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Settings, Plus } from "lucide-react";
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

export const SearchSetup = ({ user, onJobsFound }: SearchSetupProps) => {
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SearchConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    search_type: 'jsearch' as 'jsearch' | 'xray',
    query: '',
    location: '',
    keywords: '',
    remote_only: false,
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
    setFormData({
      name: '',
      search_type: 'jsearch',
      query: '',
      location: '',
      keywords: '',
      remote_only: false,
      is_recurring: false,
      schedule_frequency: 'daily',
      is_active: true
    });
    setEditingConfig(null);
    setShowForm(false);
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
      if (editingConfig) {
        await updateSearchConfig(editingConfig.id, formData);
        toast({
          title: "Search updated",
          description: "Your search configuration has been updated successfully",
        });
      } else {
        await createSearchConfig(formData);
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
    setFormData({
      name: config.name,
      search_type: config.search_type,
      query: config.query,
      location: config.location || '',
      keywords: config.keywords || '',
      remote_only: config.remote_only,
      is_recurring: config.is_recurring,
      schedule_frequency: config.schedule_frequency || 'daily',
      is_active: config.is_active
    });
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
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: {
          query: config.query,
          location: config.location || '',
          keywords: config.keywords || '',
          remote: config.remote_only
        }
      });

      if (error) throw error;

      const jobs = data.jobs || [];
      
      if (jobs.length > 0) {
        // Store in pending reviews for user to review
        await storePendingReviews(jobs, config.id, config.search_type);
        onJobsFound(jobs);
        
        toast({
          title: "Test search successful",
          description: `Found ${jobs.length} jobs. Check the Review Queue to see results.`,
        });
      } else {
        toast({
          title: "No jobs found",
          description: "Your search didn't return any results. Try adjusting your criteria.",
        });
      }
    } catch (error) {
      console.error('Error testing search:', error);
      toast({
        title: "Search failed",
        description: "Failed to test search. Please try again.",
        variant: "destructive",
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Search Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., AI Product Manager Jobs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="search_type">Search Type</Label>
                  <Select value={formData.search_type} onValueChange={(value: 'jsearch' | 'xray') => setFormData({ ...formData, search_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jsearch">JSearch API</SelectItem>
                      <SelectItem value="xray">X-ray Search</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="query">Job Title/Role</Label>
                  <Input
                    id="query"
                    value={formData.query}
                    onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                    placeholder="e.g., Product Manager"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="e.g., AI, machine learning, SaaS"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remote_only"
                  checked={formData.remote_only}
                  onCheckedChange={(checked) => setFormData({ ...formData, remote_only: checked })}
                />
                <Label htmlFor="remote_only">Remote only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring">Recurring search</Label>
              </div>

              {formData.is_recurring && (
                <div>
                  <Label htmlFor="schedule_frequency">Frequency</Label>
                  <Select value={formData.schedule_frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFormData({ ...formData, schedule_frequency: value })}>
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
                        {config.search_type.toUpperCase()}
                      </Badge>
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {config.is_recurring && (
                        <Badge variant="outline">{config.schedule_frequency}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>Query:</strong> {config.query}
                      {config.location && <span> | <strong>Location:</strong> {config.location}</span>}
                      {config.keywords && <span> | <strong>Keywords:</strong> {config.keywords}</span>}
                      {config.remote_only && <span> | <strong>Remote only</strong></span>}
                    </p>
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
