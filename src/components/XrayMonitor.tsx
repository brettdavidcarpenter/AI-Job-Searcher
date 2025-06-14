
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Edit, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createXrayConfig, getXrayConfigs, updateXrayConfig, deleteXrayConfig, type XrayConfig } from "@/services/xrayConfigService";
import { executeXraySearch, convertSerpJobToJob } from "@/services/serpApiService";
import type { User } from "@supabase/supabase-js";
import type { Job } from "@/pages/Index";

interface XrayMonitorProps {
  user: User | null;
  onJobsFound: (jobs: Job[]) => void;
}

export const XrayMonitor = ({ user, onJobsFound }: XrayMonitorProps) => {
  const [configs, setConfigs] = useState<XrayConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<XrayConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    schedule_frequency: 'manual' as 'manual' | 'daily' | 'weekly',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      loadConfigs();
    }
  }, [user]);

  const loadConfigs = async () => {
    try {
      const data = await getXrayConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading X-ray configs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create X-ray configurations",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingConfig) {
        await updateXrayConfig(editingConfig.id, formData);
        toast({
          title: "Configuration updated",
          description: "X-ray search configuration has been updated",
        });
      } else {
        await createXrayConfig(formData);
        toast({
          title: "Configuration created",
          description: "X-ray search configuration has been created",
        });
      }
      
      setFormData({ name: '', query: '', schedule_frequency: 'manual', is_active: true });
      setShowForm(false);
      setEditingConfig(null);
      await loadConfigs();
    } catch (error) {
      console.error('Error saving X-ray config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSearch = async (config: XrayConfig) => {
    setIsLoading(true);
    try {
      const serpJobs = await executeXraySearch(config.query);
      const jobs = serpJobs.map(convertSerpJobToJob);
      
      onJobsFound(jobs);
      
      // Update last_run_at
      await updateXrayConfig(config.id, { last_run_at: new Date().toISOString() });
      await loadConfigs();
      
      toast({
        title: "Search completed",
        description: `Found ${jobs.length} jobs for "${config.name}"`,
      });
    } catch (error) {
      console.error('Error running X-ray search:', error);
      toast({
        title: "Search failed",
        description: "Failed to execute X-ray search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (config: XrayConfig) => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;
    
    try {
      await deleteXrayConfig(config.id);
      await loadConfigs();
      toast({
        title: "Configuration deleted",
        description: "X-ray search configuration has been deleted",
      });
    } catch (error) {
      console.error('Error deleting X-ray config:', error);
      toast({
        title: "Error",
        description: "Failed to delete configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (config: XrayConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      query: config.query,
      schedule_frequency: config.schedule_frequency,
      is_active: config.is_active
    });
    setShowForm(true);
  };

  const handleToggleActive = async (config: XrayConfig) => {
    try {
      await updateXrayConfig(config.id, { is_active: !config.is_active });
      await loadConfigs();
      toast({
        title: config.is_active ? "Configuration disabled" : "Configuration enabled",
        description: `"${config.name}" has been ${config.is_active ? 'disabled' : 'enabled'}`,
      });
    } catch (error) {
      console.error('Error toggling config status:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration status",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500">Please sign in to use X-ray Monitor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">X-ray Monitor</h2>
          <p className="text-gray-500">Create and manage automated job searches with custom queries</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(true);
            setEditingConfig(null);
            setFormData({ name: '', query: '', schedule_frequency: 'manual', is_active: true });
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New X-ray Search
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingConfig ? 'Edit' : 'Create'} X-ray Search Configuration</CardTitle>
            <CardDescription>
              Set up a custom search query to monitor job postings. Results are automatically limited to the past 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Configuration Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Senior AI Engineer Remote"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">X-ray Query</label>
                <Textarea
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="site:linkedin.com/jobs OR site:indeed.com intitle:&quot;Senior AI Engineer&quot; AND remote"
                  className="min-h-[100px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste your Google X-ray search query here. Time constraints (past 24 hours) are added automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule</label>
                <Select 
                  value={formData.schedule_frequency} 
                  onValueChange={(value: 'manual' | 'daily' | 'weekly') => 
                    setFormData({ ...formData, schedule_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No X-ray search configurations yet</p>
              <p className="text-sm text-gray-400 mt-2">Create your first configuration to start monitoring job postings</p>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{config.name}</h3>
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{config.schedule_frequency}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 max-w-2xl">{config.query}</p>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(config.created_at).toLocaleDateString()}
                      {config.last_run_at && (
                        <span className="ml-4">
                          Last run: {new Date(config.last_run_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={() => handleToggleActive(config)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunSearch(config)}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Run Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                      disabled={isLoading}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
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
