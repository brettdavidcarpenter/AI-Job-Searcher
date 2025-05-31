
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface SearchHeaderProps {
  onSearch: (searchTerm: string, location: string, keywords: string, remote: boolean) => void;
  initialKeywords?: string;
}

export const SearchHeader = ({ onSearch, initialKeywords = "" }: SearchHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [keywords, setKeywords] = useState(initialKeywords);
  const [remote, setRemote] = useState(true); // Default to true

  // Update keywords when initialKeywords prop changes
  useEffect(() => {
    setKeywords(initialKeywords);
  }, [initialKeywords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, location, keywords, remote);
  };

  const handleClear = () => {
    setSearchTerm("");
    setLocation("");
    setKeywords("");
    setRemote(true); // Reset to default true
    onSearch("", "", "", true);
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="job-title" className="text-sm font-medium text-gray-700">
                Job Title
              </label>
              <Input
                id="job-title"
                type="text"
                placeholder="e.g. Product Manager"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-gray-700">
                Location
              </label>
              <Input
                id="location"
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="keywords" className="text-sm font-medium text-gray-700">
                Keywords
              </label>
              <Input
                id="keywords"
                type="text"
                placeholder="e.g. AI, Remote, Startup"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-2">
            <Switch
              id="remote-toggle"
              checked={remote}
              onCheckedChange={setRemote}
            />
            <label htmlFor="remote-toggle" className="text-sm font-medium text-gray-700">
              Remote work only
            </label>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Jobs
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="h-12 px-6"
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
