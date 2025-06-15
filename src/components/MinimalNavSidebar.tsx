
import { Button } from "@/components/ui/button";
import { Search, Eye, Bookmark, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface MinimalNavSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: SupabaseUser | null;
  pendingCount: number;
  savedJobsCount: number;
  onShowAuth: () => void;
  onSignOut: () => void;
}

export const MinimalNavSidebar = ({ 
  activeTab, 
  onTabChange, 
  user, 
  pendingCount, 
  savedJobsCount,
  onShowAuth,
  onSignOut 
}: MinimalNavSidebarProps) => {
  const navItems = [
    {
      id: "search",
      icon: Search,
      label: "Search",
      badge: null
    },
    {
      id: "review",
      icon: Eye,
      label: "Review",
      badge: user && pendingCount > 0 ? pendingCount : null
    },
    {
      id: "saved",
      icon: Bookmark,
      label: "Saved",
      badge: user && savedJobsCount > 0 ? savedJobsCount : null,
      disabled: !user
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-40">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Search className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(item.id)}
              disabled={item.disabled}
              className={`
                w-12 h-12 p-0 relative flex flex-col items-center justify-center
                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {item.badge && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="mt-auto">
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="w-12 h-12 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Sign Out"
          >
            <User className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowAuth}
            className="w-12 h-12 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Sign In"
          >
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
