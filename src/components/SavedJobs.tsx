
import { useState } from "react";
import { Bookmark, BookmarkX, Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Job } from "@/pages/Index";

interface SavedJobsProps {
  savedJobs: Job[];
  onUnsave: (jobId: string) => void;
  onRate: (jobId: string, rating: number) => void;
}

export const SavedJobs = ({ savedJobs, onUnsave, onRate }: SavedJobsProps) => {
  const [sortBy, setSortBy] = useState<"date" | "rating" | "company" | "source">("date");
  const [filterBy, setFilterBy] = useState<"all" | "manual" | "xray">("all");

  const filteredJobs = savedJobs.filter(job => {
    if (filterBy === "all") return true;
    return job.sourceType === filterBy;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.fitRating || 0) - (a.fitRating || 0);
      case "company":
        return a.company.localeCompare(b.company);
      case "source":
        return (a.sourceType || 'manual').localeCompare(b.sourceType || 'manual');
      case "date":
      default:
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    }
  });

  if (savedJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No saved jobs yet</h3>
        <p className="text-gray-500">Start by searching and saving jobs you're interested in!</p>
      </div>
    );
  }

  const getSourceIcon = (sourceType?: string) => {
    return sourceType === 'xray' ? <Search className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />;
  };

  const getSourceLabel = (sourceType?: string) => {
    return sourceType === 'xray' ? 'X-ray Monitor' : 'Job Search';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          My Saved Jobs ({savedJobs.length})
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <Select value={filterBy} onValueChange={(value: "all" | "manual" | "xray") => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Job Search</SelectItem>
                <SelectItem value="xray">X-ray Monitor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: "date" | "rating" | "company" | "source") => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="rating">Fit Rating</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="source">Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No jobs found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {job.title}
                    </CardTitle>
                    <p className="text-blue-600 font-medium mt-1">{job.company}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnsave(job.id)}
                    className="ml-2 h-8 w-8 p-0 hover:bg-red-50"
                  >
                    <BookmarkX className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{job.location}</p>
                  <p className="text-sm font-medium text-green-600">{job.salary}</p>
                </div>
                
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {job.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {getSourceIcon(job.sourceType)}
                        {getSourceLabel(job.sourceType)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{job.postedDate}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Fit Strength:</span>
                      <StarRating
                        rating={job.fitRating || 0}
                        onRatingChange={(rating) => onRate(job.id, rating)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
