import { useState, useEffect } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchResults } from "@/components/SearchResults";
import { SavedJobs } from "@/components/SavedJobs";
import { JobSearchLayout } from "@/components/JobSearchLayout";
import { AuthModal } from "@/components/AuthModal";
import { ResumeUpload } from "@/components/ResumeUpload";
import { XrayMonitor } from "@/components/XrayMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Monitor, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useJobSearch } from "@/hooks/useJobSearch";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { User } from "@supabase/supabase-js";
import type { Job } from "@/pages/Index";

interface JobSearchAppProps {
  user: User | null;
}

export const JobSearchApp = ({ user }: JobSearchAppProps) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  
  const { savedJobs, handleSaveJob, handleUnsaveJob, handleRateJob } = useSavedJobs(user);
  const { 
    jobs, 
    isLoading, 
    totalJobs, 
    searchStatus, 
    handleInitialSearch, 
    handleSearch, 
    loadMoreJobs, 
    updateJobSavedStatus,
    setJobs 
  } = useJobSearch(user, savedJobs);

  // Load AI product manager jobs immediately on page load
  useEffect(() => {
    const initializeSearch = async () => {
      const firstJob = await handleInitialSearch();
      if (firstJob) {
        setSelectedJob(firstJob);
      }
    };
    initializeSearch();
  }, []);

  // Listen for auth modal trigger
  useEffect(() => {
    const handleShowAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal);
    return () => window.removeEventListener('show-auth-modal', handleShowAuthModal);
  }, []);

  const onSearch = async (searchTerm: string, location: string, keywords: string, remote: boolean) => {
    setSelectedJob(null);
    const firstJob = await handleSearch(searchTerm, location, keywords, remote);
    if (firstJob) {
      setSelectedJob(firstJob);
    }
  };

  const onSaveJob = async (job: Job) => {
    await handleSaveJob(job);
    updateJobSavedStatus(job.id, true);
    
    // Update selected job if it's the same
    if (selectedJob?.id === job.id) {
      setSelectedJob({ ...selectedJob, isSaved: true });
    }
  };

  const onUnsaveJob = async (jobId: string) => {
    await handleUnsaveJob(jobId);
    updateJobSavedStatus(jobId, false);
    
    // Update selected job if it's the same
    if (selectedJob?.id === jobId) {
      setSelectedJob({ ...selectedJob, isSaved: false });
    }
  };

  const handleXrayJobsFound = (xrayJobs: Job[]) => {
    // Switch to search tab and display X-ray results
    setJobs(xrayJobs);
    setSelectedJob(xrayJobs.length > 0 ? xrayJobs[0] : null);
    setActiveTab("search");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <JobSearchLayout
      user={user}
      onSignOut={handleSignOut}
      onShowAuth={() => setShowAuthModal(true)}
      onShowResumeUpload={() => setShowResumeUpload(true)}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="search" className="text-lg py-3">
            <Search className="h-4 w-4 mr-2" />
            Job Search
          </TabsTrigger>
          <TabsTrigger value="xray" className="text-lg py-3">
            <Monitor className="h-4 w-4 mr-2" />
            X-ray Monitor
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-lg py-3" disabled={!user}>
            <Bookmark className="h-4 w-4 mr-2" />
            My Saved Jobs {user && savedJobs.length > 0 ? `(${savedJobs.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Interactive Job Search</h2>
            <p className="text-gray-600">Search for jobs in real-time and save the ones you like</p>
          </div>
          
          <SearchHeader 
            onSearch={onSearch} 
            initialKeywords="ai"
          />
          
          <SearchResults
            jobs={jobs}
            selectedJob={selectedJob}
            isLoading={isLoading}
            totalJobs={totalJobs}
            onJobSelect={setSelectedJob}
            onSaveJob={onSaveJob}
            onUnsaveJob={onUnsaveJob}
            onLoadMore={loadMoreJobs}
            user={user}
            searchStatus={searchStatus}
          />
        </TabsContent>

        <TabsContent value="xray">
          <XrayMonitor 
            user={user} 
            onJobsFound={handleXrayJobsFound}
          />
        </TabsContent>

        <TabsContent value="saved">
          {user ? (
            <SavedJobs
              savedJobs={savedJobs}
              onUnsave={onUnsaveJob}
              onRate={handleRateJob}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 mb-2">Please sign in to view your saved jobs</p>
              <p className="text-gray-400 mb-6">Save jobs while browsing to build your personal collection</p>
              <Button onClick={() => setShowAuthModal(true)} className="bg-blue-600 hover:bg-blue-700">
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {showResumeUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Resume Upload</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowResumeUpload(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <ResumeUpload user={user} />
            </div>
          </div>
        </div>
      )}
    </JobSearchLayout>
  );
};
