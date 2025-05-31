import { useState, useEffect } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { SearchHeader } from "@/components/SearchHeader";
import { JobListItem } from "@/components/JobListItem";
import { JobDetailView } from "@/components/JobDetailView";
import { SavedJobs } from "@/components/SavedJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, LogOut, Briefcase, MapPin, Building2 } from "lucide-react";
import { searchJobs, formatSalary, formatLocation, formatPostedDate, type JSearchJob } from "@/services/jobSearchService";
import { saveBdJob, unsaveJob, getSavedJobs, updateJobRating } from "@/services/savedJobsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  type: string;
  postedDate: string;
  isSaved?: boolean;
  fitRating?: number;
  applyLink?: string;
  source?: string;
}

// Helper function to check if a job was posted within the last 4 weeks
const isJobRecentlyPosted = (postedDate: string): boolean => {
  try {
    const jobDate = new Date(postedDate);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks = 28 days
    return jobDate >= fourWeeksAgo;
  } catch {
    // If we can't parse the date, include the job to be safe
    return true;
  }
};

const JobSearchApp = ({ user }: { user: User | null }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState<{searchTerm: string, location: string, keywords: string, source: string} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

  // Load saved jobs on component mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  // Load AI jobs immediately on page load
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
    console.log("Loading initial AI jobs...");
    setIsLoading(true);
    
    try {
      const response = await searchJobs({
        keywords: "ai",
        page: 1,
        num_pages: 1,
        source: 'all'
      });
      
      if (response.status === 'OK' && response.data) {
        let convertedJobs = response.data.map(convertJSearchJobToJob);
        
        // Filter jobs to only include those posted in the last 4 weeks
        convertedJobs = convertedJobs.filter(job => isJobRecentlyPosted(job.postedDate));
        
        // Check which jobs are already saved (only if user is authenticated)
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        setLastSearchParams({ searchTerm: "", location: "", keywords: "ai", source: "all" });
        
        // Auto-select first job if available
        if (jobsWithSavedStatus.length > 0) {
          setSelectedJob(jobsWithSavedStatus[0]);
        }
      } else {
        setJobs([]);
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Initial search error:', error);
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string, location: string, keywords: string, source: string = 'all') => {
    console.log("Searching for:", { searchTerm, location, keywords, source });
    setIsLoading(true);
    setCurrentPage(1);
    setLastSearchParams({ searchTerm, location, keywords, source });
    setSelectedJob(null);
    
    try {
      const response = await searchJobs({
        query: searchTerm || undefined,
        location: location || undefined,
        keywords: keywords || undefined,
        page: 1,
        num_pages: 1,
        source: source as 'all' | 'jsearch' | 'linkedin'
      });
      
      if (response.status === 'OK' && response.data) {
        let convertedJobs = response.data.map(convertJSearchJobToJob);
        
        // Filter jobs to only include those posted in the last 4 weeks
        convertedJobs = convertedJobs.filter(job => isJobRecentlyPosted(job.postedDate));
        
        // Check which jobs are already saved (only if user is authenticated)
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        setJobs(jobsWithSavedStatus);
        setTotalJobs(convertedJobs.length);
        // Auto-select first job if available
        if (jobsWithSavedStatus.length > 0) {
          setSelectedJob(jobsWithSavedStatus[0]);
        }
        toast({
          title: "Search completed",
          description: `Found ${convertedJobs.length} recent jobs from ${source === 'all' ? 'multiple sources' : source}`,
        });
      } else {
        setJobs([]);
        setSelectedJob(null);
        setTotalJobs(0);
        toast({
          title: "No recent jobs found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setJobs([]);
      setSelectedJob(null);
      setTotalJobs(0);
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
    if (!lastSearchParams || isLoading) return;
    
    setIsLoading(true);
    const nextPage = currentPage + 1;
    
    try {
      const response = await searchJobs({
        query: lastSearchParams.searchTerm || undefined,
        location: lastSearchParams.location || undefined,
        keywords: lastSearchParams.keywords || undefined,
        page: nextPage,
        num_pages: 1,
        source: lastSearchParams.source as 'all' | 'jsearch' | 'linkedin'
      });
      
      if (response.status === 'OK' && response.data) {
        let convertedJobs = response.data.map(convertJSearchJobToJob);
        
        // Filter jobs to only include those posted in the last 4 weeks
        convertedJobs = convertedJobs.filter(job => isJobRecentlyPosted(job.postedDate));
        
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        setJobs(prev => [...prev, ...jobsWithSavedStatus]);
        setCurrentPage(nextPage);
        toast({
          title: "More jobs loaded",
          description: `Loaded ${convertedJobs.length} more recent jobs`,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">AI Job Board</h1>
              <p className="text-sm text-gray-600">The Go-To Job Board for AI, ML, Data Science & SDE</p>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <Button variant="outline" onClick={handleSignOut} size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="search" className="text-lg py-3">
              <Briefcase className="h-4 w-4 mr-2" />
              AI Jobs
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-lg py-3" disabled={!user}>
              Saved Jobs {user ? `(${savedJobs.length})` : '(Login Required)'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <SearchHeader onSearch={handleSearch} />
            
            {isLoading && jobs.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg text-gray-600">Loading AI jobs...</span>
              </div>
            )}
            
            {jobs.length > 0 && (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {totalJobs}+ recent AI jobs found
                  </h2>
                  <div className="text-sm text-gray-500">
                    Updated just now • Last 4 weeks
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-6 h-[800px]">
                  {/* Job List - Left Side */}
                  <div className="col-span-5 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {jobs.map((job) => (
                        <JobListItem
                          key={job.id}
                          job={job}
                          isSelected={selectedJob?.id === job.id}
                          onClick={() => setSelectedJob(job)}
                        />
                      ))}
                      
                      {/* Load More Button */}
                      <Button 
                        onClick={loadMoreJobs}
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
                    </div>
                  </div>
                  
                  {/* Job Detail - Right Side */}
                  <div className="col-span-7">
                    <JobDetailView
                      job={selectedJob}
                      onSave={handleSaveJob}
                      onUnsave={handleUnsaveJob}
                    />
                  </div>
                </div>
              </>
            )}

            {!isLoading && jobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No recent AI jobs found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your search filters or using different keywords.</p>
              </div>
            )}
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
        </Tabs>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Save Your Favorite Jobs</h2>
            <p className="text-gray-600 mb-6">Create a free account to save jobs and track your applications</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowAuthModal(false)} variant="outline" className="flex-1">
                Continue Browsing
              </Button>
              <Button onClick={() => {
                setShowAuthModal(false);
                // Trigger the main auth modal
                window.dispatchEvent(new CustomEvent('show-auth-modal'));
              }} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <JobSearchApp user={user} />}
    </AuthWrapper>
  );
};

export default Index;
