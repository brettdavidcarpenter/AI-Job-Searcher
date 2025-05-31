
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface JobSearchWidgetProps {
  onSearch: () => void;
}

export const JobSearchWidget = ({ onSearch }: JobSearchWidgetProps) => {
  const [searchTerm, setSearchTerm] = useState("AI PM");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Job Search</h2>
          <p className="text-gray-600">Find AI Product Manager roles and other opportunities</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Job title (e.g. AI PM)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Location (e.g. San Francisco, CA)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
          >
            <Search className="w-5 h-5 mr-2" />
            Search Jobs
          </Button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Search across LinkedIn, JSearch and other top job platforms
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
