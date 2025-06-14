
import { useState } from "react";
import { searchJobs } from "@/services/jobSearchService";
import { convertJSearchJobToJob } from "@/utils/jobFormatters";
import { toast } from "@/hooks/use-toast";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

interface SearchParams {
  searchTerm: string;
  location: string;
  keywords: string;
  remote: boolean;
}

interface SearchStatus {
  isFromCache: boolean;
  isFallback: boolean;
  fallbackLevel: string;
  cacheAgeHours?: number;
  errorMessage?: string;
}

export const useJobSearch = (user: User | null, savedJobs: Job[]) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({
    isFromCache: false,
    isFallback: false,
    fallbackLevel: 'unknown'
  });

  const updateJobsWithSavedStatus = (jobList: Job[]) => {
    return jobList.map(job => ({
      ...job,
      isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
    }));
  };

  const handleInitialSearch = async () => {
    console.log("Loading initial AI product manager jobs...");
    setIsLoading(true);
    
    try {
      const result = await searchJobs({
        query: "product manager",
        keywords: "ai",
        location: "united states",
        remote: true,
        page: 1,
        num_pages: 1
      });
      
      setSearchStatus({
        isFromCache: result.isFromCache,
        isFallback: result.isFallback,
        fallbackLevel: result.fallbackLevel,
        cacheAgeHours: result.cacheAgeHours,
        errorMessage: result.errorMessage
      });
      
      if (result.response.status === 'OK' && result.response.data) {
        const convertedJobs = result.response.data.map(convertJSearchJobToJob);
        const jobsWithSavedStatus = updateJobsWithSavedStatus(convertedJobs);
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        setLastSearchParams({ searchTerm: "product manager", location: "united states", keywords: "ai", remote: true });
        
        return jobsWithSavedStatus.length > 0 ? jobsWithSavedStatus[0] : null;
      }
    } catch (error) {
      console.error('Initial search error:', error);
      setSearchStatus(prev => ({ ...prev, errorMessage: "Failed to load jobs. Please try refreshing the page." }));
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  const handleSearch = async (searchTerm: string, location: string, keywords: string, remote: boolean) => {
    setIsLoading(true);
    setCurrentPage(1);
    setLastSearchParams({ searchTerm, location, keywords, remote });
    
    try {
      const result = await searchJobs({
        query: searchTerm || undefined,
        location: location || undefined,
        keywords: keywords || undefined,
        remote,
        page: 1,
        num_pages: 1
      });
      
      setSearchStatus({
        isFromCache: result.isFromCache,
        isFallback: result.isFallback,
        fallbackLevel: result.fallbackLevel,
        cacheAgeHours: result.cacheAgeHours,
        errorMessage: result.errorMessage
      });
      
      if (result.response.status === 'OK' && result.response.data) {
        const convertedJobs = result.response.data.map(convertJSearchJobToJob);
        const jobsWithSavedStatus = updateJobsWithSavedStatus(convertedJobs);
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        
        // Enhanced toast messages based on fallback level
        let toastTitle = "Search completed";
        let toastDescription = `Found ${convertedJobs.length} recent jobs`;
        
        if (result.isFallback) {
          switch (result.fallbackLevel) {
            case 'expired_cache':
              toastTitle = "Showing cached results";
              toastDescription = `Found ${convertedJobs.length} jobs from ${result.cacheAgeHours} hours ago`;
              break;
            case 'recent_global':
              toastTitle = "Showing recent jobs";
              toastDescription = `Found ${convertedJobs.length} recent AI jobs`;
              break;
            case 'static':
              toastTitle = "Showing curated jobs";
              toastDescription = "Live search temporarily unavailable";
              break;
          }
        } else if (result.isFromCache) {
          toastTitle = "Showing cached results";
          toastDescription = `Found ${convertedJobs.length} cached jobs`;
        }
        
        toast({
          title: toastTitle,
          description: toastDescription,
        });
        
        return jobsWithSavedStatus.length > 0 ? jobsWithSavedStatus[0] : null;
      } else {
        setJobs([]);
        setTotalJobs(0);
        toast({
          title: "No jobs found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setJobs([]);
      setTotalJobs(0);
      setSearchStatus(prev => ({ ...prev, errorMessage: "Search failed. Please try again." }));
      toast({
        title: "Search failed",
        description: "There was an error searching for jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  const loadMoreJobs = async () => {
    if (!lastSearchParams || isLoading || searchStatus.fallbackLevel === 'static') return;
    
    setIsLoading(true);
    const nextPage = currentPage + 1;
    
    try {
      const result = await searchJobs({
        query: lastSearchParams.searchTerm || undefined,
        location: lastSearchParams.location || undefined,
        keywords: lastSearchParams.keywords || undefined,
        remote: lastSearchParams.remote,
        page: nextPage,
        num_pages: 1
      });
      
      if (result.response.status === 'OK' && result.response.data) {
        const convertedJobs = result.response.data.map(convertJSearchJobToJob);
        const jobsWithSavedStatus = updateJobsWithSavedStatus(convertedJobs);
        
        setJobs(prev => [...prev, ...jobsWithSavedStatus]);
        setCurrentPage(nextPage);
        toast({
          title: "More jobs loaded",
          description: `Loaded ${convertedJobs.length} more jobs`,
        });
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast({
        title: "Failed to load more jobs",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobSavedStatus = (jobId: string, isSaved: boolean) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved } : j));
  };

  // Function to directly set jobs (used for X-ray results)
  const setJobsDirectly = (newJobs: Job[]) => {
    const jobsWithSavedStatus = updateJobsWithSavedStatus(newJobs);
    setJobs(jobsWithSavedStatus);
    setTotalJobs(newJobs.length);
    setLastSearchParams(null); // Clear search params since these are X-ray results
  };

  return {
    jobs,
    isLoading,
    totalJobs,
    searchStatus,
    handleInitialSearch,
    handleSearch,
    loadMoreJobs,
    updateJobSavedStatus,
    setJobs: setJobsDirectly
  };
};
