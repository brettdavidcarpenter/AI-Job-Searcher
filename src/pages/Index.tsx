import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { JobCard } from "@/components/JobCard";
import { SavedJobs } from "@/components/SavedJobs";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
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

const JobSearchApp = ({ user }: { user: User }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{searchTerm: string, location: string, keywords: string, source: string} | null>(null);

  // Load saved jobs on component mount
  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
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

  const handleSearch = async (searchTerm: string, location: string, keywords: string, source: string = 'all') => {
    console.log("Searching for:", { searchTerm, location, keywords, source });
    setIsLoading(true);
    setCurrentPage(1);
    setLastSearchParams({ searchTerm, location, keywords, source });
    
    try {
      // Combine search term and keywords
      const query = [searchTerm, keywords].filter(Boolean).join(' ');
      
      const response = await searchJobs({
        query: query || undefined,
        location: location || undefined,
        page: 1,
        num_pages: 1,
        source: source as 'all' | 'jsearch' | 'linkedin'
      });
      
      if (response.status === 'OK' && response.data) {
        const convertedJobs = response.data.map(convertJSearchJobToJob);
        
        // Check which jobs are already saved
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: savedJobs.some(savedJob => savedJob.id === job.id)
        }));
        
        setJobs(jobsWithSavedStatus);
        setHasSearched(true);
        toast({
          title: "Search completed",
          description: `Found ${convertedJobs.length} jobs from ${source === 'all' ? 'multiple sources' : source}`,
        });
      } else {
        setJobs([]);
        toast({
          title: "No jobs found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setJobs([]);
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
      const query = [lastSearchParams.searchTerm, lastSearchParams.keywords].filter(Boolean).join(' ');
      
      const response = await searchJobs({
        query: query || undefined,
        location: lastSearchParams.location || undefined,
        page: nextPage,
        num_pages: 1,
        source: lastSearchParams.source as 'all' | 'jsearch' | 'linkedin'
      });
      
      if (response.status === 'OK' && response.data) {
        const convertedJobs = response.data.map(convertJSearchJobToJob);
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: savedJobs.some(savedJob => savedJob.id === job.id)
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
    console.log("Saving job:", job.title);
    
    try {
      await saveBdJob(job);
      
      // Update local state
      const jobWithSaved = { ...job, isSaved: true, fitRating: 0 };
      setSavedJobs(prev => [...prev, jobWithSaved]);
      setJobs(jobs.map(j => j.id === job.id ? { ...j, isSaved: true } : j));
      
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
    const job = savedJobs.find(j => j.id === jobId);
    console.log("Unsaving job:", jobId);
    
    try {
      await unsaveJob(jobId);
      
      // Update local state
      setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: false } : j));
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Search Tool</h1>
            <p className="text-lg text-gray-600">Find your perfect job from LinkedIn and JSearch listings</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search" className="text-lg py-3">Search Jobs</TabsTrigger>
            <TabsTrigger value="saved" className="text-lg py-3">
              Saved Jobs ({savedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <SearchHeader onSearch={handleSearch} />
            
            {isLoading && jobs.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg text-gray-600">Searching for jobs...</span>
              </div>
            )}
            
            {jobs.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSave={handleSaveJob}
                      onUnsave={handleUnsaveJob}
                    />
                  ))}
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMoreJobs}
                    disabled={isLoading}
                    variant="outline"
                    className="px-8 py-2"
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
              </>
            )}

            {hasSearched && jobs.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No jobs found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your search filters or using different keywords.</p>
              </div>
            )}

            {!hasSearched && !isLoading && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">Search for jobs to get started!</p>
                <p className="text-gray-400 mt-2">Use the search form above to find relevant job opportunities.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <SavedJobs
              savedJobs={savedJobs}
              onUnsave={handleUnsaveJob}
              onRate={handleRateJob}
            />
          </TabsContent>
        </Tabs>
      </div>
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
