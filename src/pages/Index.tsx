
import { useState } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { JobCard } from "@/components/JobCard";
import { SavedJobs } from "@/components/SavedJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  type: string;
  postedDate: string;
  isSaved?: boolean;
  fitRating?: number;
}

// Mock job data for demonstration
const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "Tech Innovations Inc.",
    location: "San Francisco, CA",
    salary: "$120,000 - $180,000",
    description: "We're looking for a Senior Software Engineer to join our dynamic team. You'll work on cutting-edge technologies and help build scalable applications that serve millions of users.",
    type: "Full-time",
    postedDate: "2 days ago"
  },
  {
    id: "2",
    title: "Product Manager",
    company: "StartupCorp",
    location: "New York, NY",
    salary: "$100,000 - $150,000",
    description: "Join our product team to drive innovation and strategy. You'll work closely with engineering and design teams to deliver exceptional user experiences.",
    type: "Full-time",
    postedDate: "1 day ago"
  },
  {
    id: "3",
    title: "UX Designer",
    company: "Design Studio Pro",
    location: "Remote",
    salary: "$80,000 - $120,000",
    description: "Create beautiful and intuitive user experiences for our clients. You'll work on diverse projects ranging from mobile apps to enterprise software.",
    type: "Contract",
    postedDate: "3 days ago"
  },
  {
    id: "4",
    title: "Data Scientist",
    company: "Analytics Plus",
    location: "Austin, TX",
    salary: "$110,000 - $160,000",
    description: "Use machine learning and statistical analysis to extract insights from large datasets. Help drive data-driven decision making across the organization.",
    type: "Full-time",
    postedDate: "5 days ago"
  },
  {
    id: "5",
    title: "Marketing Manager",
    company: "Growth Marketing Co.",
    location: "Chicago, IL",
    salary: "$75,000 - $110,000",
    description: "Lead our marketing initiatives and develop strategies to increase brand awareness. You'll manage campaigns across multiple channels and analyze performance metrics.",
    type: "Full-time",
    postedDate: "1 week ago"
  },
  {
    id: "6",
    title: "DevOps Engineer",
    company: "Cloud Solutions Ltd.",
    location: "Seattle, WA",
    salary: "$130,000 - $190,000",
    description: "Build and maintain our cloud infrastructure. You'll work with containerization, CI/CD pipelines, and monitoring systems to ensure reliable deployments.",
    type: "Full-time",
    postedDate: "4 days ago"
  }
];

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(mockJobs);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  const handleSearch = (searchTerm: string, location: string, keywords: string) => {
    console.log("Searching for:", { searchTerm, location, keywords });
    
    const filtered = jobs.filter(job => {
      const matchesTitle = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = location === "" || job.location.toLowerCase().includes(location.toLowerCase());
      const matchesKeywords = keywords === "" || 
        job.description.toLowerCase().includes(keywords.toLowerCase()) ||
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
        job.company.toLowerCase().includes(keywords.toLowerCase());
      
      return matchesTitle && matchesLocation && matchesKeywords;
    });
    
    setFilteredJobs(filtered);
  };

  const handleSaveJob = (job: Job) => {
    console.log("Saving job:", job.title);
    
    if (!savedJobs.find(savedJob => savedJob.id === job.id)) {
      const jobWithSaved = { ...job, isSaved: true, fitRating: 0 };
      setSavedJobs([...savedJobs, jobWithSaved]);
      
      // Update the job in the main list
      setJobs(jobs.map(j => j.id === job.id ? { ...j, isSaved: true } : j));
      setFilteredJobs(filteredJobs.map(j => j.id === job.id ? { ...j, isSaved: true } : j));
    }
  };

  const handleUnsaveJob = (jobId: string) => {
    console.log("Unsaving job:", jobId);
    
    setSavedJobs(savedJobs.filter(job => job.id !== jobId));
    
    // Update the job in the main list
    setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: false } : j));
    setFilteredJobs(filteredJobs.map(j => j.id === jobId ? { ...j, isSaved: false } : j));
  };

  const handleRateJob = (jobId: string, rating: number) => {
    console.log("Rating job:", jobId, "with", rating, "stars");
    
    setSavedJobs(savedJobs.map(job => 
      job.id === jobId ? { ...job, fitRating: rating } : job
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Search Tool</h1>
          <p className="text-lg text-gray-600">Find your perfect job and track your applications</p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search" className="text-lg py-3">Search Jobs</TabsTrigger>
            <TabsTrigger value="saved" className="text-lg py-3">
              Saved Jobs ({savedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <SearchHeader onSearch={handleSearch} />
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSave={handleSaveJob}
                  onUnsave={handleUnsaveJob}
                />
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No jobs found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <SavedJobs
              savedJobs={savedJobs}
              onUnsave={handleUnsaveJob}
              onRate={handleRateJob}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
