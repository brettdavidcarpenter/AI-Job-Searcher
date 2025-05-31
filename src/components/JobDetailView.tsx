
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Bookmark, BookmarkCheck, MapPin, DollarSign, Calendar, Building2 } from "lucide-react";
import { JobMatchCalculator } from "./JobMatchCalculator";
import { useAuthContext } from "./AuthWrapper";
import type { Job } from "@/pages/Index";

interface JobDetailViewProps {
  job: Job | null;
  onSave: (job: Job) => void;
  onUnsave: (jobId: string) => void;
}

export const JobDetailView = ({ job, onSave, onUnsave }: JobDetailViewProps) => {
  const { user } = useAuthContext();

  if (!job) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building2 className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Job</h3>
          <p className="text-gray-500">Choose a job from the list to view details and calculate match scores</p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveToggle = () => {
    if (job.isSaved) {
      onUnsave(job.id);
    } else {
      onSave(job);
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Job Header */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <div className="flex items-center gap-2 text-lg text-gray-600">
                <Building2 className="h-5 w-5" />
                {job.company}
              </div>
            </div>
            <Button
              variant={job.isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSaveToggle}
              className="shrink-0"
            >
              {job.isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save Job
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {job.salary}
              </div>
            )}
            {job.postedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {job.postedDate}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary">{job.type}</Badge>
            {job.source && <Badge variant="outline">{job.source}</Badge>}
          </div>

          {job.applyLink && (
            <Button asChild className="w-full">
              <a href={job.applyLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </a>
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Match Calculator */}
      <JobMatchCalculator job={job} user={user} />

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: job.description?.replace(/\n/g, '<br />') || 'No description available.' 
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
