
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { useState } from "react";
import type { MatchScore } from "@/services/jobMatchingService";

interface MatchScoreDisplayProps {
  matchScore: MatchScore;
  compact?: boolean;
}

export const MatchScoreDisplay = ({ matchScore, compact = false }: MatchScoreDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (compact) {
    return (
      <Badge variant={getScoreBadgeVariant(matchScore.overall_score)} className="text-sm">
        {matchScore.overall_score}% Match
      </Badge>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Job Match Score</span>
          <Badge variant={getScoreBadgeVariant(matchScore.overall_score)} className="text-lg px-3 py-1">
            {matchScore.overall_score}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {matchScore.skills_score !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Skills Match</span>
                <span className={getScoreColor(matchScore.skills_score)}>{matchScore.skills_score}%</span>
              </div>
              <Progress value={matchScore.skills_score} className="h-2" />
            </div>
          )}
          
          {matchScore.experience_score !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Experience Match</span>
                <span className={getScoreColor(matchScore.experience_score)}>{matchScore.experience_score}%</span>
              </div>
              <Progress value={matchScore.experience_score} className="h-2" />
            </div>
          )}
          
          {matchScore.education_score !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Education Match</span>
                <span className={getScoreColor(matchScore.education_score)}>{matchScore.education_score}%</span>
              </div>
              <Progress value={matchScore.education_score} className="h-2" />
            </div>
          )}
          
          {matchScore.requirements_score !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Requirements Match</span>
                <span className={getScoreColor(matchScore.requirements_score)}>{matchScore.requirements_score}%</span>
              </div>
              <Progress value={matchScore.requirements_score} className="h-2" />
            </div>
          )}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            View Detailed Analysis
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {matchScore.breakdown.strengths.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </div>
                <ul className="text-sm space-y-1">
                  {matchScore.breakdown.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {matchScore.breakdown.gaps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  Areas for Improvement
                </div>
                <ul className="text-sm space-y-1">
                  {matchScore.breakdown.gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {matchScore.breakdown.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-blue-700">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations
                </div>
                <ul className="text-sm space-y-1">
                  {matchScore.breakdown.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
