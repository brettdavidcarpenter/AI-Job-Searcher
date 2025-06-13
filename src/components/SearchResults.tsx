
import { useState } from "react";
import { JobListItem } from "@/components/JobListItem";
import { JobDetailView } from "@/components/JobDetailView";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Database, Wifi, Clock, RefreshCw } from "lucide-react";
import { SearchStats } from "@/components/SearchStats";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

interface SearchResultsProps {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  totalJobs: number;
  onJobSelect: (job: Job) => void;
  onSaveJob: (job: Job) => void;
  onUnsaveJob: (jobId: string) => void;
  onLoadMore: () => void;
  user?: User | null;
  isFromCache?: boolean;
  isFallback?: boolean;
  fallbackLevel?: string;
  cacheAgeHours?: number;
  errorMessage?: string;
}

export const SearchResults = ({
  jobs,
  selectedJob,
  isLoading,
  totalJobs,
  onJobSelect,
  onSaveJob,
  onUnsaveJob,
  onLoadMore,
  user,
  isFromCache = false,
  isFallback = false,
  fallbackLevel = 'unknown',
  cacheAgeHours,
  errorMessage
}: SearchResultsProps) => {
  // Helper function to get alert info based on priority
  const getAlertInfo = () => {
    // Priority 1: Fallback scenarios
    if (isFallback) {
      switch (fallbackLevel) {
        case 'expired_cache':
          return {
            icon: Clock,
            variant: 'default' as const,
            color: 'blue',
            title: `Showing cached results from ${cacheAgeHours || 'several'} hours ago`,
            message: errorMessage || 'Live search temporarily unavailable.'
          };
        case 'recent_global':
          return {
            icon: Database,
            variant: 'default' as const,
            color: 'amber',
            title: `Showing recent AI jobs from ${cacheAgeHours || 'several'} hours ago`,
            message: errorMessage || 'Displaying the most recent available results.'
          };
        case 'static':
          return {
            icon: Wifi,
            variant: 'default' as const,
            color: 'orange',
            title: 'Showing curated AI jobs',
            message: errorMessage || 'Live search temporarily unavailable.'
          };
        default:
          return {
            icon: AlertCircle,
            variant: 'default' as const,
            color: 'red',
            title: 'Using backup results',
            message: errorMessage || 'Search service temporarily unavailable.'
          };
      }
    }

    // Priority 2: Cache scenarios (when not fallback)
    if (isFromCache && fallbackLevel === 'cache') {
      return {
        icon: Database,
        variant: 'default' as const,
        color: 'blue',
        title: 'Showing cached results',
        message: 'Results are refreshed every 6 hours for faster loading.'
      };
    }

    // Priority 3: Other errors
    if (errorMessage && !isFallback && !isFromCache) {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'red',
        title: 'Search issue',
        message: errorMessage
      };
    }

    return null;
  };

  const alertInfo = getAlertInfo();

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-600">Loading AI jobs...</span>
      </div>
    );
  }

  if (!isLoading && jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500">No recent AI jobs found matching your criteria.</p>
        <p className="text-gray-400 mt-2">Try adjusting your search filters or using different keywords.</p>
      </div>
    );
  }

  return (
    <>
      {/* Single consolidated alert */}
      {alertInfo && (
        <Alert className={`mb-4 border-${alertInfo.color}-200 bg-${alertInfo.color}-50`}>
          <alertInfo.icon className={`h-4 w-4 text-${alertInfo.color}-600`} />
          <AlertDescription className={`text-${alertInfo.color}-800`}>
            <div className="font-medium">{alertInfo.title}</div>
            <div className="text-sm mt-1">{alertInfo.message}</div>
          </AlertDescription>
        </Alert>
      )}

      <SearchStats totalJobs={totalJobs} />
      
      <div className="grid grid-cols-12 gap-6 h-[800px]">
        {/* Job List - Left Side */}
        <div className="col-span-5 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {jobs.map((job) => (
              <JobListItem
                key={job.id}
                job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={() => onJobSelect(job)}
              />
            ))}
            
            {/* Load More Button - hide for static fallback results */}
            {fallbackLevel !== 'static' && (
              <Button 
                onClick={onLoadMore}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading more jobs...
                  </>
                ) : (
                  'Load More Jobs'
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Job Detail - Right Side */}
        <div className="col-span-7">
          <JobDetailView
            job={selectedJob}
            onSave={onSaveJob}
            onUnsave={onUnsaveJob}
            user={user}
          />
        </div>
      </div>
    </>
  );
};
