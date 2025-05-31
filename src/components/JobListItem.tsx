
import { Building2, MapPin, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/pages/Index";

interface JobListItemProps {
  job: Job;
  isSelected: boolean;
  onClick: () => void;
}

export const JobListItem = ({ job, isSelected, onClick }: JobListItemProps) => {
  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'linkedin':
        return 'bg-blue-100 text-blue-800';
      case 'jsearch':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/50' 
          : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className={`font-semibold text-sm line-clamp-2 ${
              isSelected ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {job.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 text-gray-500" />
              <p className="text-sm text-blue-600 font-medium truncate">{job.company}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <DollarSign className="h-3 w-3" />
              <span className="truncate">{job.salary}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{job.postedDate}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-xs">
              {job.type}
            </Badge>
            {job.source && (
              <Badge className={`text-xs ${getSourceBadgeColor(job.source)}`}>
                {job.source === 'linkedin' ? 'LinkedIn' : job.source === 'jsearch' ? 'JSearch' : job.source}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
