
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface HeroSearchLandingProps {
  onSearch: (searchTerm: string, location: string) => void;
  onShowFeatures: () => void;
}

export const HeroSearchLanding = ({ onSearch, onShowFeatures }: HeroSearchLandingProps) => {
  const [searchTerm, setSearchTerm] = useState("AI Product Manager");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, location);
  };

  const quickActions = [
    { label: "AI Jobs", action: () => onSearch("AI", "") },
    { label: "Remote", action: () => onSearch("", "Remote") },
    { label: "Startup", action: () => onSearch("startup", "") },
    { label: "ML Engineer", action: () => onSearch("Machine Learning Engineer", "") }
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="w-full max-w-3xl px-6">
        {/* Hero Message */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Find Your Dream AI Job
            </h1>
          </div>
          <p className="text-xl text-blue-100 mb-2">
            Discover opportunities in AI, ML, and Data Science
          </p>
          <p className="text-blue-200/80">
            Search across top platforms and get personalized matches
          </p>
        </div>

        {/* Main Search Input */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm mb-8">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="What role are you looking for?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-14 text-lg px-4"
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Where? (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-14 text-lg px-4"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                <Search className="w-5 h-5 mr-3" />
                Search Jobs
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* More Features Link */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onShowFeatures}
            className="text-blue-200 hover:text-white hover:bg-white/10"
          >
            Advanced features & automation →
          </Button>
        </div>
      </div>
    </div>
  );
};
