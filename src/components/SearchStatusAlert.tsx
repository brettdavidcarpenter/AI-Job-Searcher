
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Database, Wifi, Clock } from "lucide-react";

interface SearchStatusAlertProps {
  isFromCache?: boolean;
  isFallback?: boolean;
  fallbackLevel?: string;
  cacheAgeHours?: number;
  errorMessage?: string;
}

export const SearchStatusAlert = ({
  isFromCache = false,
  isFallback = false,
  fallbackLevel = 'unknown',
  cacheAgeHours,
  errorMessage
}: SearchStatusAlertProps) => {
  // Helper function to get alert info based on priority
  const getAlertInfo = () => {
    // Priority 1: Fallback scenarios
    if (isFallback) {
      switch (fallbackLevel) {
        case 'expired_cache':
          return {
            icon: Clock,
            variant: 'default' as const,
            color: 'blue',
            title: `Showing cached results from ${cacheAgeHours || 'several'} hours ago`,
            message: errorMessage || 'Live search temporarily unavailable.'
          };
        case 'recent_global':
          return {
            icon: Database,
            variant: 'default' as const,
            color: 'amber',
            title: `Showing recent AI jobs from ${cacheAgeHours || 'several'} hours ago`,
            message: errorMessage || 'Displaying the most recent available results.'
          };
        case 'static':
          return {
            icon: Wifi,
            variant: 'default' as const,
            color: 'orange',
            title: 'Showing curated AI jobs',
            message: errorMessage || 'Live search temporarily unavailable.'
          };
        default:
          return {
            icon: AlertCircle,
            variant: 'default' as const,
            color: 'red',
            title: 'Using backup results',
            message: errorMessage || 'Search service temporarily unavailable.'
          };
      }
    }

    // Priority 2: Cache scenarios (when not fallback)
    if (isFromCache && fallbackLevel === 'cache') {
      return {
        icon: Database,
        variant: 'default' as const,
        color: 'blue',
        title: 'Showing cached results',
        message: 'Results are refreshed every 6 hours for faster loading.'
      };
    }

    // Priority 3: Other errors
    if (errorMessage && !isFallback && !isFromCache) {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'red',
        title: 'Search issue',
        message: errorMessage
      };
    }

    return null;
  };

  const alertInfo = getAlertInfo();

  if (!alertInfo) {
    return null;
  }

  return (
    <Alert className={`mb-4 border-${alertInfo.color}-200 bg-${alertInfo.color}-50`}>
      <alertInfo.icon className={`h-4 w-4 text-${alertInfo.color}-600`} />
      <AlertDescription className={`text-${alertInfo.color}-800`}>
        <div className="font-medium">{alertInfo.title}</div>
        <div className="text-sm mt-1">{alertInfo.message}</div>
      </AlertDescription>
    </Alert>
  );
};
