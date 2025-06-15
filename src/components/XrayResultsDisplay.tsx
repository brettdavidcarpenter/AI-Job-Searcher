
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getXrayResultsByConfig, convertXrayResultToJob, type XrayResult } from "@/services/xrayResultsService";
import { toast } from "@/hooks/use-toast";
import type { Job } from "@/pages/Index";

interface XrayResultsDisplayProps {
  configId: string;
  configName: string;
  onSaveJob: (job: Job) => void;
}

export const XrayResultsDisplay = ({ configId, configName, onSaveJob }: XrayResultsDisplayProps) => {
  const [results, setResults] = useState<XrayResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadResults();
    }
  }, [configId, isOpen]);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const data = await getXrayResultsByConfig(configId);
      setResults(data);
    } catch (error) {
      console.error('Error loading X-ray results:', error);
      toast({
        title: "Error",
        description: "Failed to load recent finds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = async (result: XrayResult) => {
    const job = convertXrayResultToJob(result);
    await onSaveJob(job);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto"
          disabled={isLoading}
        >
          <span className="text-sm text-gray-600">
            Recent Finds ({results.length})
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading recent finds...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No jobs found yet. Run the search to see results here.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Card key={result.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{result.job_title}</h4>
                      <p className="text-sm text-blue-600">{result.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {result.location && (
                          <span className="text-xs text-gray-500">{result.location}</span>
                        )}
                        {result.salary && (
                          <Badge variant="outline" className="text-xs">{result.salary}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Found: {formatDate(result.found_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveJob(result)}
                        className="h-8 w-8 p-0"
                      >
                        <Bookmark className="h-3 w-3" />
                      </Button>
                      {result.apply_link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(result.apply_link, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
