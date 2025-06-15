
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Bookmark, Eye, Trash2, CheckSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getPendingReviews, markAsReviewed, convertPendingReviewToJob, type PendingReview } from "@/services/pendingReviewsService";
import type { User } from "@supabase/supabase-js";
import type { Job } from "@/pages/Index";

interface ReviewQueueProps {
  user: User | null;
  onSaveJob: (job: Job) => void;
}

export const ReviewQueue = ({ user, onSaveJob }: ReviewQueueProps) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingReviews();
    }
  }, [user]);

  const loadPendingReviews = async () => {
    try {
      const data = await getPendingReviews();
      setPendingReviews(data);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
    }
  };

  const handleSelectReview = (reviewId: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (checked) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(new Set(pendingReviews.map(r => r.id)));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleSaveSelected = async () => {
    if (selectedReviews.size === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select jobs to save",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reviewsToSave = pendingReviews.filter(r => selectedReviews.has(r.id));
      
      for (const review of reviewsToSave) {
        const job = convertPendingReviewToJob(review);
        await onSaveJob(job);
      }

      await markAsReviewed(Array.from(selectedReviews));
      await loadPendingReviews();
      setSelectedReviews(new Set());

      toast({
        title: "Jobs saved",
        description: `${reviewsToSave.length} jobs have been saved to your collection`,
      });
    } catch (error) {
      console.error('Error saving selected jobs:', error);
      toast({
        title: "Error",
        description: "Failed to save selected jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissSelected = async () => {
    if (selectedReviews.size === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select jobs to dismiss",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await markAsReviewed(Array.from(selectedReviews));
      await loadPendingReviews();
      setSelectedReviews(new Set());

      toast({
        title: "Jobs dismissed",
        description: `${selectedReviews.size} jobs have been dismissed`,
      });
    } catch (error) {
      console.error('Error dismissing selected jobs:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss selected jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIndividual = async (review: PendingReview) => {
    try {
      const job = convertPendingReviewToJob(review);
      await onSaveJob(job);
      await markAsReviewed([review.id]);
      await loadPendingReviews();

      toast({
        title: "Job saved",
        description: `${review.job_title} has been saved to your collection`,
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'jsearch': return 'default';
      case 'xray': return 'secondary';
      case 'manual': return 'outline';
      default: return 'outline';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Sign in to see pending reviews</h3>
        <p className="text-gray-500">Job findings from your automated searches will appear here for review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Review Queue ({pendingReviews.length})
          </h2>
          <p className="text-gray-600">New job findings awaiting your review</p>
        </div>
        
        {pendingReviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSelectAll(selectedReviews.size !== pendingReviews.length)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedReviews.size === pendingReviews.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedReviews.size > 0 && (
              <>
                <Button onClick={handleSaveSelected} disabled={isLoading}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save Selected ({selectedReviews.size})
                </Button>
                <Button variant="outline" onClick={handleDismissSelected} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Dismiss Selected
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {pendingReviews.length === 0 ? (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No jobs pending review</h3>
          <p className="text-gray-500">
            Set up automated searches in the Search Setup tab to start finding new opportunities
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <Card key={review.id} className="border border-gray-200">
              <Collapsible
                open={expandedReviews.has(review.id)}
                onOpenChange={() => toggleExpanded(review.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onCheckedChange={(checked) => handleSelectReview(review.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{review.job_title}</CardTitle>
                          <Badge variant={getSourceBadgeColor(review.source_type)}>
                            {review.source_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-blue-600 font-medium">{review.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {review.location && <span>{review.location}</span>}
                          {review.salary && <span className="text-green-600 font-medium">{review.salary}</span>}
                          <span>Found: {formatDate(review.found_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveIndividual(review)}
                      >
                        <Bookmark className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {expandedReviews.has(review.id) ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {review.job_type && (
                        <div>
                          <Badge variant="secondary">{review.job_type}</Badge>
                        </div>
                      )}
                      
                      {review.description && (
                        <div>
                          <h4 className="font-medium mb-2">Job Description</h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {review.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Source: {review.source}
                          {review.posted_date && <span> | Posted: {review.posted_date}</span>}
                        </div>
                        {review.apply_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(review.apply_link, '_blank')}
                          >
                            View Original
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
