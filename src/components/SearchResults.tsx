
import { JobListItem } from "@/components/JobListItem";
import { JobDetailView } from "@/components/JobDetailView";
import { SearchStatusAlert } from "@/components/SearchStatusAlert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SearchStats } from "@/components/SearchStats";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

interface SearchStatus {
  isFromCache: boolean;
  isFallback: boolean;
  fallbackLevel: string;
  cacheAgeHours?: number;
  errorMessage?: string;
}

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
  searchStatus: SearchStatus;
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
  searchStatus
}: SearchResultsProps) => {
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
      <SearchStatusAlert {...searchStatus} />
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
            {searchStatus.fallbackLevel !== 'static' && (
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
