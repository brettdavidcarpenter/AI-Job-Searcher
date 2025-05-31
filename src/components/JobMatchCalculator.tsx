
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calculator, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { calculateJobMatch, getJobMatchScore, type MatchScore } from "@/services/jobMatchingService";
import { getUserResumes, type Resume } from "@/services/resumeService";
import { MatchScoreDisplay } from "./MatchScoreDisplay";
import type { Job } from "@/pages/Index";
import { useEffect } from "react";

interface JobMatchCalculatorProps {
  job: Job;
  user: any;
}

export const JobMatchCalculator = ({ job, user }: JobMatchCalculatorProps) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResumes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedResumeId && user) {
      loadExistingScore();
    }
  }, [selectedResumeId, job.id]);

  const loadResumes = async () => {
    try {
      const userResumes = await getUserResumes();
      // Only show resumes that have extracted text
      const resumesWithText = userResumes.filter(resume => resume.extracted_text);
      setResumes(resumesWithText);
      
      if (resumesWithText.length > 0) {
        setSelectedResumeId(resumesWithText[0].id);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingScore = async () => {
    if (!selectedResumeId) return;
    
    try {
      const existingScore = await getJobMatchScore(job.id, selectedResumeId);
      setMatchScore(existingScore);
    } catch (error) {
      console.error('Error loading existing score:', error);
    }
  };

  const handleCalculateMatch = async () => {
    if (!selectedResumeId) {
      toast({
        title: "Please select a resume",
        description: "Choose a resume to calculate the match score",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const score = await calculateJobMatch(job, selectedResumeId);
      setMatchScore(score);
      
      toast({
        title: "Match score calculated",
        description: `Your match score is ${score.overall_score}%`,
      });
    } catch (error) {
      console.error('Error calculating match score:', error);
      toast({
        title: "Calculation failed",
        description: "Unable to calculate match score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500">Sign in to calculate job match scores</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-gray-500 mt-2">Loading resumes...</p>
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center space-y-3">
          <FileText className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-gray-500">No resumes available for matching</p>
          <p className="text-sm text-gray-400">Upload a resume to calculate match scores</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Calculate Job Match</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Select Resume</label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleCalculateMatch}
              disabled={isCalculating || !selectedResumeId}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Calculating Match...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Match Score
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {matchScore && (
        <MatchScoreDisplay matchScore={matchScore} />
      )}
    </div>
  );
};
