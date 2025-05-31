import { useState, useEffect } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { JobSearchWidget } from "@/components/JobSearchWidget";
import { SearchHeader } from "@/components/SearchHeader";
import { JobListItem } from "@/components/JobListItem";
import { JobDetailView } from "@/components/JobDetailView";
import { SavedJobs } from "@/components/SavedJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, CheckCircle, Search, Star, Bookmark } from "lucide-react";
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

const LandingPage = ({ user }: { user: User | null }) => {
  const [showFullSearch, setShowFullSearch] = useState(false);

  const handleWidgetSearch = () => {
    setShowFullSearch(true);
  };

  if (showFullSearch) {
    return <JobSearchApp user={user} onBackToLanding={() => setShowFullSearch(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Search Tool</h1>
            <p className="text-lg text-gray-600">Find your perfect job from LinkedIn and JSearch listings</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" onClick={async () => await supabase.auth.signOut()} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* Job Search Widget */}
        <div className="mb-12">
          <JobSearchWidget onSearch={handleWidgetSearch} />
        </div>

        {/* Landing Page Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Advanced Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Search across multiple job platforms including LinkedIn and JSearch with advanced filtering options.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Save & Organize</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Save interesting jobs and organize them with ratings and notes to track your application process.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Rate & Track</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rate job opportunities based on fit and track your applications to stay organized.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Jobs</h3>
              <p className="text-gray-600">Enter your job title, location, and keywords to find relevant opportunities.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
              <p className="text-gray-600">Save jobs that interest you and rate them based on how well they fit your goals.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Apply & Track</h3>
              <p className="text-gray-600">Keep track of your applications and follow up on promising opportunities.</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Why Choose Our Job Search Tool?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Job Sources</h3>
                <p className="text-gray-600">Search across LinkedIn, JSearch, and other major job platforms from one place.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Organization</h3>
                <p className="text-gray-600">Save jobs, rate them, and keep track of your application status in one dashboard.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Results</h3>
                <p className="text-gray-600">Get the latest job postings with real-time search across multiple platforms.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Free to Use</h3>
                <p className="text-gray-600">Create a free account to start saving jobs and organizing your job search.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Find Your Dream Job?</h2>
          <p className="text-lg text-gray-600 mb-8">Join thousands of job seekers who use our platform to find better opportunities.</p>
          <Button onClick={handleWidgetSearch} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
            Start Job Search
          </Button>
        </div>
      </div>
    </div>
  );
};

const JobSearchApp = ({ user, onBackToLanding }: { user: User | null; onBackToLanding?: () => void }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{searchTerm: string, location: string, keywords: string, source: string} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load saved jobs on component mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

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
        const convertedJobs = response.data.map(convertJSearchJobToJob);
        
        // Check which jobs are already saved (only if user is authenticated)
        const jobsWithSavedStatus = convertedJobs.map(job => ({
          ...job,
          isSaved: user ? savedJobs.some(savedJob => savedJob.id === job.id) : false
        }));
        
        setJobs(jobsWithSavedStatus);
        setHasSearched(true);
        // Auto-select first job if available
        if (jobsWithSavedStatus.length > 0) {
          setSelectedJob(jobsWithSavedStatus[0]);
        }
        toast({
          title: "Search completed",
          description: `Found ${convertedJobs.length} jobs from ${source === 'all' ? 'multiple sources' : source}`,
        });
      } else {
        setJobs([]);
        setSelectedJob(null);
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
        const convertedJobs = response.data.map(convertJSearchJobToJob);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {onBackToLanding && (
              <Button variant="outline" onClick={onBackToLanding}>
                ← Back to Home
              </Button>
            )}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Search Tool</h1>
              <p className="text-lg text-gray-600">Find your perfect job from LinkedIn and JSearch listings</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
          {!user && (
            <Button onClick={() => setShowAuthModal(true)} className="bg-blue-600 hover:bg-blue-700">
              Sign In / Sign Up
            </Button>
          )}
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search" className="text-lg py-3">Search Jobs</TabsTrigger>
            <TabsTrigger value="saved" className="text-lg py-3" disabled={!user}>
              Saved Jobs {user ? `(${savedJobs.length})` : '(Login Required)'}
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
                    <div className="pt-4">
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
      {(user) => <LandingPage user={user} />}
    </AuthWrapper>
  );
};

export default Index;
