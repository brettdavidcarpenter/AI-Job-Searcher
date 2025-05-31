
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Calendar, DollarSign, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/pages/Index";

interface JobDetailViewProps {
  job: Job | null;
  onSave: (job: Job) => void;
  onUnsave: (jobId: string) => void;
}

export const JobDetailView = ({ job, onSave, onUnsave }: JobDetailViewProps) => {
  if (!job) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center p-8">
          <p className="text-xl text-gray-500 mb-2">No job selected</p>
          <p className="text-gray-400">Select a job from the list to view details</p>
        </CardContent>
      </Card>
    );
  }

  const handleBookmarkClick = () => {
    if (job.isSaved) {
      onUnsave(job.id);
    } else {
      onSave(job);
    }
  };

  const handleApplyClick = () => {
    if (job.applyLink) {
      window.open(job.applyLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'linkedin':
        return 'bg-blue-100 text-blue-800';
      case 'jsearch':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-lg text-blue-600 font-medium mb-3">
              <Building2 className="h-5 w-5" />
              {job.company}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {job.postedDate}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {job.salary}
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                {job.type}
              </Badge>
              {job.source && (
                <Badge className={`text-sm ${getSourceBadgeColor(job.source)}`}>
                  {job.source === 'linkedin' ? 'LinkedIn' : job.source === 'jsearch' ? 'JSearch' : job.source}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmarkClick}
            className="ml-4 h-10 w-10 p-0 hover:bg-blue-50"
          >
            {job.isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-400 hover:text-blue-600" />
            )}
          </Button>
        </div>
        
        <div className="flex gap-3">
          {job.applyLink && (
            <Button 
              onClick={handleApplyClick}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleBookmarkClick}
            className="px-6"
          >
            {job.isSaved ? 'Saved' : 'Save Job'}
          </Button>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Job</h3>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
