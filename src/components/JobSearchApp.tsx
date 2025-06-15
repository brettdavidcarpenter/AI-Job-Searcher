
import { useState, useEffect } from "react";
import { AuthModal } from "@/components/AuthModal";
import { ResumeUpload } from "@/components/ResumeUpload";
import { SearchSetup } from "@/components/SearchSetup";
import { ReviewQueue } from "@/components/ReviewQueue";
import { SavedJobs } from "@/components/SavedJobs";
import { JobSearchTab } from "@/components/JobSearchTab";
import { JobSearchLayout } from "@/components/JobSearchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Eye, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSavedJobs } from "@/hooks/useSavedJobs";
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

  // Listen for auth modal trigger
  useEffect(() => {
    const handleShowAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('show-auth-modal', handleShowAuthModal);
    return () => window.removeEventListener('show-auth-modal', handleShowAuthModal);
  }, []);

  const handleJobsFound = (jobs: Job[]) => {
    // Switch to review queue when new jobs are found
    setActiveTab("review");
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
          <TabsTrigger value="review" className="text-lg py-3">
            <Eye className="h-4 w-4 mr-2" />
            Review Queue
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-lg py-3" disabled={!user}>
            <Bookmark className="h-4 w-4 mr-2" />
            My Saved Jobs {user && savedJobs.length > 0 ? `(${savedJobs.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <JobSearchTab user={user} onSetupAutomation={handleSetupAutomation} />
        </TabsContent>

        <TabsContent value="review">
          <ReviewQueue user={user} onSaveJob={onSaveJob} />
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

      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Set Up Automated Searches</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowSetupModal(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <SearchSetup user={user} onJobsFound={handleJobsFound} />
            </div>
          </div>
        </div>
      )}
    </JobSearchLayout>
  );
};
