import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface FocusedSearchInterfaceProps {
  onSearch: (searchTerm: string, location: string, keywords: string, remote: boolean) => void;
  isLoading: boolean;
}
export const FocusedSearchInterface = ({
  onSearch,
  isLoading
}: FocusedSearchInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm, "", "", false);
    }
  };
  const quickActions = [{
    label: "AI Jobs",
    action: () => onSearch("AI", "", "", false)
  }, {
    label: "Remote",
    action: () => onSearch("", "", "", true)
  }, {
    label: "ML Engineer",
    action: () => onSearch("Machine Learning Engineer", "", "", false)
  }, {
    label: "Data Scientist",
    action: () => onSearch("Data Scientist", "", "", false)
  }, {
    label: "Product Manager",
    action: () => onSearch("Product Manager", "", "", false)
  }];
  return <div className="max-w-3xl mx-auto py-12">
      {/* Main Heading */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-semibold mb-6 text-cyan-900">
          What kind of job are you looking for?
        </h1>
        
        {/* Large Search Input */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <Input type="text" placeholder="AI Product Manager, Machine Learning Engineer, Data Scientist..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={isLoading} className="h-16 text-lg px-6 pr-16 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 placeholder:text-gray-400" />
          <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="absolute right-2 top-2 h-12 w-12 p-0 rounded-xl bg-cyan-900 hover:bg-cyan-800">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {quickActions.map((action, index) => <Button key={index} variant="outline" onClick={action.action} disabled={isLoading} className="px-4 py-2 rounded-full border-gray-200 hover:bg-gray-50 text-gray-500">
            {action.label}
          </Button>)}
      </div>
    </div>;
};