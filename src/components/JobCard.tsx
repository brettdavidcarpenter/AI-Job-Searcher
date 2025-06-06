
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/pages/Index";

interface JobCardProps {
  job: Job;
  onSave: (job: Job) => void;
  onUnsave: (jobId: string) => void;
}

export const JobCard = ({ job, onSave, onUnsave }: JobCardProps) => {
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
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm hover:bg-white group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.title}
            </CardTitle>
            <p className="text-blue-600 font-medium mt-1">{job.company}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmarkClick}
            className="ml-2 h-8 w-8 p-0 hover:bg-blue-50"
          >
            {job.isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-blue-600" />
            ) : (
              <Bookmark className="h-4 w-4 text-gray-400 hover:text-blue-600" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{job.location}</p>
          <p className="text-sm font-medium text-green-600">{job.salary}</p>
        </div>
        
        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
          {job.description}
        </p>
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {job.type}
            </Badge>
            {job.source && (
              <Badge className={`text-xs ${getSourceBadgeColor(job.source)}`}>
                {job.source === 'linkedin' ? 'LinkedIn' : job.source === 'jsearch' ? 'JSearch' : job.source}
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">{job.postedDate}</span>
        </div>

        {job.applyLink && (
          <div className="pt-2">
            <Button 
              onClick={handleApplyClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
