
import { useState, useEffect } from "react";
import { saveBdJob, unsaveJob, getSavedJobs, updateJobRating } from "@/services/savedJobsService";
import { toast } from "@/hooks/use-toast";
import type { Job } from "@/pages/Index";
import type { User } from "@supabase/supabase-js";

export const useSavedJobs = (user: User | null) => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  // Load saved jobs on component mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  const loadSavedJobs = async () => {
    if (!user) return;
    
    try {
      const savedJobsData = await getSavedJobs();
      setSavedJobs(savedJobsData);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  };

  const handleSaveJob = async (job: Job) => {
    if (!user) {
      // Trigger auth modal
      window.dispatchEvent(new CustomEvent('show-auth-modal'));
      return;
    }
    
    try {
      await saveBdJob(job);
      const jobWithSaved = { ...job, isSaved: true, fitRating: 0 };
      setSavedJobs(prev => [...prev, jobWithSaved]);
      
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
    
    try {
      await unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      
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
    
    try {
      await updateJobRating(jobId, rating);
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

  return {
    savedJobs,
    handleSaveJob,
    handleUnsaveJob,
    handleRateJob
  };
};
