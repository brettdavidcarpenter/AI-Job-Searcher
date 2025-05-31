
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Save Your Favorite Jobs</h2>
        <p className="text-gray-600 mb-6">Create a free account to save jobs and track your applications</p>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Continue Browsing
          </Button>
          <Button onClick={() => {
            onClose();
            // Trigger the main auth modal
            window.dispatchEvent(new CustomEvent('show-auth-modal'));
          }} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Sign Up Free
          </Button>
        </div>
      </div>
    </div>
  );
};
