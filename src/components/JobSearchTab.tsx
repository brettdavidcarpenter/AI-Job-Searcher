
import { useState, useEffect } from "react";
import { SemanticSearchBar } from "@/components/SemanticSearchBar";
import { SearchResults } from "@/components/SearchResults";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { useJobSearch } from "@/hooks/useJobSearch";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

interface JobSearchTabProps {
  user: User | null;
  onSetupAutomation: () => void;
}

export const JobSearchTab = ({ user, onSetupAutomation }: JobSearchTabProps) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { savedJobs, handleSaveJob, handleUnsaveJob } = useSavedJobs(user);
  
  const {
    jobs,
    isLoading,
    totalJobs,
    searchStatus,
    handleInitialSearch,
    handleSearch,
    loadMoreJobs,
    updateJobSavedStatus
  } = useJobSearch(user, savedJobs);

  // Load initial AI PM jobs on mount
  useEffect(() => {
    const loadInitial = async () => {
      const firstJob = await handleInitialSearch();
      if (firstJob) {
        setSelectedJob(firstJob);
      }
    };
    loadInitial();
  }, []);

  const onJobSelect = (job: Job) => {
    setSelectedJob(job);
  };

  const onSaveJob = async (job: Job) => {
    await handleSaveJob(job, job.sourceType || 'manual');
    updateJobSavedStatus(job.id, true);
  };

  const onUnsaveJob = async (jobId: string) => {
    await handleUnsaveJob(jobId);
    updateJobSavedStatus(jobId, false);
  };

  const onSearch = async (searchTerm: string, location: string, keywords: string, remote: boolean) => {
    const firstJob = await handleSearch(searchTerm, location, keywords, remote);
    if (firstJob) {
      setSelectedJob(firstJob);
    }
  };

  return (
    <div className="space-y-8">
      {/* Automation Setup CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Love what you're finding? Set up automated searches!
            </h3>
            <p className="text-gray-600">
              Get new matching jobs delivered automatically. Save time and never miss opportunities.
            </p>
          </div>
          <Button 
            onClick={onSetupAutomation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Up Auto Search
          </Button>
        </div>
      </div>

      {/* AI Search Interface */}
      <SemanticSearchBar onSearch={onSearch} isLoading={isLoading} />

      {/* Search Results */}
      <SearchResults
        jobs={jobs}
        selectedJob={selectedJob}
        isLoading={isLoading}
        totalJobs={totalJobs}
        onJobSelect={onJobSelect}
        onSaveJob={onSaveJob}
        onUnsaveJob={onUnsaveJob}
        onLoadMore={loadMoreJobs}
        user={user}
        searchStatus={searchStatus}
      />
    </div>
  );
};
