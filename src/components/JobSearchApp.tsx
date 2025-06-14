
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
import { Briefcase, FileText, Search } from "lucide-react";
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
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="search" className="text-lg py-3">
            <Briefcase className="h-4 w-4 mr-2" />
            AI Jobs
          </TabsTrigger>
          <TabsTrigger value="xray" className="text-lg py-3">
            <Search className="h-4 w-4 mr-2" />
            X-ray Monitor
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
