
import { AuthWrapper } from "@/components/AuthWrapper";
import { JobSearchApp } from "@/components/JobSearchApp";
import type { User } from "@supabase/supabase-js";

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
  applyLink?: string;
  source?: string;
}

const Index = () => {
  return (
    <AuthWrapper>
      {(user: User | null) => <JobSearchApp user={user} />}
    </AuthWrapper>
  );
};

export default Index;
