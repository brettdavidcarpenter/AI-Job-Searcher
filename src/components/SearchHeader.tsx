
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchHeaderProps {
  onSearch: (searchTerm: string, location: string, keywords: string, source: string) => void;
}

export const SearchHeader = ({ onSearch }: SearchHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [keywords, setKeywords] = useState("");
  const [source, setSource] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass the job title and keywords separately, don't combine them
    onSearch(searchTerm, location, keywords, source);
  };

  const handleClear = () => {
    setSearchTerm("");
    setLocation("");
    setKeywords("");
    setSource("all");
    onSearch("", "", "", "all");
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="job-title" className="text-sm font-medium text-gray-700">
                Job Title
              </label>
              <Input
                id="job-title"
                type="text"
                placeholder="e.g. Software Engineer"
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
                placeholder="e.g. React, Python, Remote"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium text-gray-700">
                Search Source
              </label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="jsearch">JSearch</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
