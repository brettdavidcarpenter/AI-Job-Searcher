
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface MinimalHeaderProps {
  user: User | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  onShowResumeUpload: () => void;
}

export const MinimalHeader = ({ user, onSignOut, onShowAuth, onShowResumeUpload }: MinimalHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="px-6 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Job Board</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="ghost"
                onClick={onShowResumeUpload}
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <FileText className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button variant="ghost" onClick={onSignOut} size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={onShowAuth} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
