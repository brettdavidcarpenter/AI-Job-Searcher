
import { Button } from "@/components/ui/button";
import { LogOut, FileText } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface JobSearchLayoutProps {
  user: User | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  onShowResumeUpload: () => void;
  children: React.ReactNode;
}

export const JobSearchLayout = ({ user, onSignOut, onShowAuth, onShowResumeUpload, children }: JobSearchLayoutProps) => {
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
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onShowResumeUpload}
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
              
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <Button variant="outline" onClick={onSignOut} size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={onShowAuth} className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
};
