
import { useState, useEffect } from "react";
import { AuthModal } from "@/components/AuthModal";
import { ResumeUpload } from "@/components/ResumeUpload";
import { SearchSetup } from "@/components/SearchSetup";
import { ReviewQueue } from "@/components/ReviewQueue";
import { SavedJobs } from "@/components/SavedJobs";
import { JobSearchTab } from "@/components/JobSearchTab";
import { MinimalNavSidebar } from "@/components/MinimalNavSidebar";
import { MinimalHeader } from "@/components/MinimalHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { usePendingReviews } from "@/hooks/usePendingReviews";
import { useJobSearch } from "@/hooks/useJobSearch";
import type { User } from "@supabase/supabase-js";
import type { Job } from "@/pages/Index";

interface JobSearchAppProps {
  user: User | null;
}

export const JobSearchApp = ({ user }: JobSearchAppProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  const { savedJobs, handleSaveJob, handleUnsaveJob, handleRateJob } = useSavedJobs(user);
  const { pendingReviews, pendingCount, refreshReviews, setPendingReviews } = usePendingReviews(user);
  const { handleInitialSearch, handleSearch } = useJobSearch(user, savedJobs);

  // Listen for auth modal trigger
  useEffect(() => {
    const handleShowAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal);
    return () => window.removeEventListener('show-auth-modal', handleShowAuthModal);
  }, []);

  const handleJobsFound = (jobs: Job[]) => {
    // Switch to review queue when new jobs are found and refresh the reviews
    setActiveTab("review");
    refreshReviews();
  };

  const onSaveJob = async (job: Job) => {
    await handleSaveJob(job, job.sourceType || 'manual');
  };

  const onUnsaveJob = async (jobId: string) => {
    await handleUnsaveJob(jobId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSetupAutomation = () => {
    setShowSetupModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Only show navigation sidebar if user is signed in */}
      {user && (
        <MinimalNavSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          pendingCount={pendingCount}
          savedJobsCount={savedJobs.length}
          onShowAuth={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
        />
      )}

      {/* Header with authentication controls */}
      <div className={`flex-1 ${user ? 'ml-16' : ''}`}>
        <MinimalHeader
          user={user}
          onSignOut={handleSignOut}
          onShowAuth={() => setShowAuthModal(true)}
          onShowResumeUpload={() => setShowResumeUpload(true)}
        />
        
        <div className="px-6 py-6">
          {activeTab === "search" && (
            <JobSearchTab 
              user={user} 
              onSetupAutomation={handleSetupAutomation}
              onShowResumeUpload={() => setShowResumeUpload(true)}
            />
          )}

          {activeTab === "review" && user && (
            <ReviewQueue 
              user={user} 
              onSaveJob={onSaveJob}
              pendingReviews={pendingReviews}
              setPendingReviews={setPendingReviews}
              refreshReviews={refreshReviews}
            />
          )}

          {activeTab === "saved" && user && (
            <SavedJobs
              savedJobs={savedJobs}
              onUnsave={onUnsaveJob}
              onRate={handleRateJob}
            />
          )}

          {activeTab === "saved" && !user && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 mb-2">Please sign in to view your saved jobs</p>
              <p className="text-gray-400 mb-6">Save jobs while browsing to build your personal collection</p>
            </div>
          )}
        </div>
      </div>
      
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
                <button
                  onClick={() => setShowResumeUpload(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <ResumeUpload user={user} />
            </div>
          </div>
        </div>
      )}

      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Set Up Automated Searches</h2>
                <button
                  onClick={() => setShowSetupModal(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <SearchSetup user={user} onJobsFound={handleJobsFound} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
