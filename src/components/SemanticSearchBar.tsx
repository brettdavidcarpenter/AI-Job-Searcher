
import { useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SemanticSearchBarProps {
  onSearch: (searchTerm: string, location: string, keywords: string, remote: boolean) => void;
  isLoading?: boolean;
}

const EXAMPLE_QUERIES = [
  "AI product manager remote positions",
  "Software engineer at tech startups in SF",
  "Senior data scientist healthcare industry",
  "Remote UX designer fintech companies",
  "DevOps engineer with AWS experience",
];

export const SemanticSearchBar = ({ onSearch, isLoading = false }: SemanticSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing || isLoading) return;

    setIsProcessing(true);
    setConfidence(null);

    try {
      const { data } = await supabase.functions.invoke('parse-search-query', {
        body: { query: query.trim() }
      });

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('AI parsed query:', data);
      setConfidence(data.confidence);

      // Convert parsed query to search parameters
      const searchTerm = data.jobTitle || "";
      const location = data.location || "";
      const keywords = data.keywords || "";
      const remote = data.remote || false;

      onSearch(searchTerm, location, keywords, remote);
    } catch (error) {
      console.error('Error processing search query:', error);
      // Fallback to direct search with the query as keywords
      onSearch("", "", query, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Job Search</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe what you're looking for in natural language. Our AI will understand and find the perfect jobs for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </div>
            <Input
              type="text"
              placeholder="e.g., 'AI product manager at tech startups, remote work preferred'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-16 pl-12 pr-4 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
              disabled={isProcessing || isLoading}
            />
            {confidence && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Badge variant={confidence > 85 ? "default" : confidence > 70 ? "secondary" : "outline"}>
                  {confidence}% match
                </Badge>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg"
            disabled={!query.trim() || isProcessing || isLoading}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI is understanding your query...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching for jobs...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Find Jobs with AI
              </>
            )}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-4 text-center">Try these examples:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLE_QUERIES.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(example)}
                className="text-xs hover:bg-blue-50 hover:border-blue-300"
                disabled={isProcessing || isLoading}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
