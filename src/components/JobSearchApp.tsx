import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchResults } from "@/components/SearchResults";
import { SavedJobs } from "@/components/SavedJobs";
import { JobSearchLayout } from "@/components/JobSearchLayout";
import { AuthModal } from "@/components/AuthModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { searchJobs, formatSalary, formatLocation, formatPostedDate, type JSearchJob } from "@/services/jobSearchService";
import { saveBdJob, unsaveJob, getSavedJobs, updateJobRating } from "@/services/savedJobsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import type { Job } from "@/pages/Index";
import { ResumeUpload } from "@/components/ResumeUpload";
import { FileText } from "lucide-react";

interface JobSearchAppProps {
  user: User | null;
}

interface LastSearchParams {
  searchTerm: string;
  location: string;
  keywords: string;
  remote: boolean;
}

export const JobSearchApp = ({ user }: JobSearchAppProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState<LastSearchParams | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  
  // New state for handling API status
  const [isFromCache, setIsFromCache] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Load saved jobs on component mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  // Load AI product manager jobs immediately on page load
  useEffect(() => {
    handleInitialSearch();
  }, []);

  // Listen for auth modal trigger
  useEffect(() => {
    const handleShowAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal);
    return () => window.removeEventListener('show-auth-modal', handleShowAuthModal);
  }, []);

  const loadSavedJobs = async () => {
    if (!user) return;
    
    try {
      const savedJobsData = await getSavedJobs();
      setSavedJobs(savedJobsData);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  };

  const convertJSearchJobToJob = (jsearchJob: JSearchJob): Job => {
    return {
      id: jsearchJob.job_id,
      title: jsearchJob.job_title,
      company: jsearchJob.employer_name,
      location: formatLocation(jsearchJob),
      salary: formatSalary(jsearchJob),
      description: jsearchJob.job_description,
      type: jsearchJob.job_employment_type || 'Full-time',
      postedDate: formatPostedDate(jsearchJob.job_posted_at_datetime_utc),
      applyLink: jsearchJob.job_apply_link,
      isSaved: false,
      fitRating: 0,
      source: jsearchJob.source
    };
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
      
      console.log("Initial search result:", result);
      
      // Update status information
      setIsFromCache(result.isFromCache);
      setIsFallback(result.isFallback);
      setErrorMessage(result.errorMessage);
      
      if (result.response.status === 'OK' && result.response.data) {
        let convertedJobs = result.response.data.map(convertJSearchJobToJob);
        console.log("Converted jobs:", convertedJobs);
        
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        console.log("Final jobs with saved status:", jobsWithSavedStatus);
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        setLastSearchParams({ searchTerm: "product manager", location: "united states", keywords: "ai", remote: true });
        
        if (jobsWithSavedStatus.length > 0) {
          setSelectedJob(jobsWithSavedStatus[0]);
          console.log("Selected first job:", jobsWithSavedStatus[0]);
        }
      } else {
        console.log("No jobs found in response");
        setJobs([]);
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Initial search error:', error);
      setJobs([]);
      setSelectedJob(null);
      setErrorMessage("Failed to load jobs. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string, location: string, keywords: string, remote: boolean) => {
    console.log("Searching for:", { searchTerm, location, keywords, remote });
    setIsLoading(true);
    setCurrentPage(1);
    setLastSearchParams({ searchTerm, location, keywords, remote });
    setSelectedJob(null);
    
    try {
      const result = await searchJobs({
        query: searchTerm || undefined,
        location: location || undefined,
        keywords: keywords || undefined,
        remote,
        page: 1,
        num_pages: 1
      });
      
      // Update status information
      setIsFromCache(result.isFromCache);
      setIsFallback(result.isFallback);
      setErrorMessage(result.errorMessage);
      
      if (result.response.status === 'OK' && result.response.data) {
        let convertedJobs = result.response.data.map(convertJSearchJobToJob);
        
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        
        if (jobsWithSavedStatus.length > 0) {
          setSelectedJob(jobsWithSavedStatus[0]);
        }
        
        toast({
          title: result.isFallback ? "Showing curated jobs" : "Search completed",
          description: result.isFallback 
            ? "Live search temporarily unavailable" 
            : `Found ${convertedJobs.length} recent jobs`,
        });
      } else {
        setJobs([]);
        setSelectedJob(null);
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
      setSelectedJob(null);
      setTotalJobs(0);
      setErrorMessage("Search failed. Please try again.");
      toast({
        title: "Search failed",
        description: "There was an error searching for jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreJobs = async () => {
    if (!lastSearchParams || isLoading || isFallback) return;
    
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
        let convertedJobs = result.response.data.map(convertJSearchJobToJob);
        
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
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

  const handleSaveJob = async (job: Job) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    console.log("Saving job:", job.title);
    
    try {
      await saveBdJob(job);
      
      // Update local state
      const jobWithSaved = { ...job, isSaved: true, fitRating: 0 };
      setSavedJobs(prev => [...prev, jobWithSaved]);
      setJobs(jobs.map(j => j.id === job.id ? { ...j, isSaved: true } : j));
      
      // Update selected job if it's the same
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, isSaved: true });
      }
      
      toast({
        title: "Job saved",
        description: `${job.title} has been saved to your list`,
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Failed to save job",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!user) return;
    
    const job = savedJobs.find(j => j.id === jobId);
    console.log("Unsaving job:", jobId);
    
    try {
      await unsaveJob(jobId);
      
      // Update local state
      setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: false } : j));
      
      // Update selected job if it's the same
      if (selectedJob?.id === jobId) {
        setSelectedJob({ ...selectedJob, isSaved: false });
      }
      
      if (job) {
        toast({
          title: "Job removed",
          description: `${job.title} has been removed from your saved jobs`,
        });
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
      toast({
        title: "Failed to remove job",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRateJob = async (jobId: string, rating: number) => {
    if (!user) return;
    
    console.log("Rating job:", jobId, "with", rating, "stars");
    
    try {
      await updateJobRating(jobId, rating);
      
      // Update local state
      setSavedJobs(savedJobs.map(job => 
        job.id === jobId ? { ...job, fitRating: rating } : job
      ));
      
      toast({
        title: "Rating updated",
        description: `Job rating updated to ${rating} stars`,
      });
    } catch (error) {
      console.error('Error rating job:', error);
      toast({
        title: "Failed to update rating",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  console.log("Current jobs state:", jobs);
  console.log("Is loading:", isLoading);

  return (
    <JobSearchLayout
      user={user}
      onSignOut={handleSignOut}
      onShowAuth={() => setShowAuthModal(true)}
    >
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="search" className="text-lg py-3">
            <Briefcase className="h-4 w-4 mr-2" />
            AI Jobs
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-lg py-3" disabled={!user}>
            Saved Jobs {user ? `(${savedJobs.length})` : '(Login Required)'}
          </TabsTrigger>
          <TabsTrigger value="resume" className="text-lg py-3">
            <FileText className="h-4 w-4 mr-2" />
            Resume
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <SearchHeader 
            onSearch={handleSearch} 
            initialKeywords="ai"
          />
          
          <SearchResults
            jobs={jobs}
            selectedJob={selectedJob}
            isLoading={isLoading}
            totalJobs={totalJobs}
            onJobSelect={setSelectedJob}
            onSaveJob={handleSaveJob}
            onUnsaveJob={handleUnsaveJob}
            onLoadMore={loadMoreJobs}
            user={user}
            isFromCache={isFromCache}
            isFallback={isFallback}
            errorMessage={errorMessage}
          />
        </TabsContent>

        <TabsContent value="saved">
          {user ? (
            <SavedJobs
              savedJobs={savedJobs}
              onUnsave={handleUnsaveJob}
              onRate={handleRateJob}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">Please sign in to view your saved jobs</p>
              <Button onClick={() => setShowAuthModal(true)} className="mt-4">
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resume">
          <ResumeUpload user={user} />
        </TabsContent>
      </Tabs>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </JobSearchLayout>
  );
};
