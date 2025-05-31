
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Search, Star, Bookmark } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Find Your Dream Job with AI-Powered Search
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Search millions of jobs from LinkedIn and JSearch, save your favorites, 
              and never miss the perfect opportunity. Our intelligent platform helps you 
              discover roles that match your skills and aspirations.
            </p>
          </div>

          {/* Value Proposition Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Search across multiple job boards with intelligent filtering by title, location, and keywords
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save & Organize</h3>
              <p className="text-gray-600">
                Save jobs you love and rate them to keep track of your application pipeline
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rate & Track</h3>
              <p className="text-gray-600">
                Rate job opportunities and track your favorites to streamline your job search process
              </p>
            </div>
          </div>

          {/* Screenshots Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">See How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Job search interface showing search results"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">1. Search Jobs Across Multiple Platforms</h3>
                  <p className="text-gray-600">
                    Use our powerful search to find jobs from LinkedIn and JSearch with advanced filtering options
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Woman using laptop to save and organize job applications"
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">2. Save & Rate Your Favorite Jobs</h3>
                  <p className="text-gray-600">
                    Keep track of opportunities that interest you and rate them to prioritize your applications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Job Search Platform?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Access to Millions of Jobs</h4>
                  <p className="text-gray-600">Search across LinkedIn and JSearch databases simultaneously</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Advanced Filtering</h4>
                  <p className="text-gray-600">Filter by job title, location, keywords, and source</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Personal Job Library</h4>
                  <p className="text-gray-600">Save and organize jobs that match your interests</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Rating System</h4>
                  <p className="text-gray-600">Rate jobs to keep track of your top choices</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Opportunity?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of job seekers who have found their dream jobs with our platform
            </p>
          </div>

          {/* Auth Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Get Started Today</CardTitle>
                <CardDescription>Create your free account and start searching for jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signup" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signup">Sign Up Free</TabsTrigger>
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={authLoading}>
                        {authLoading ? "Creating account..." : "Start Your Job Search"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        By signing up, you agree to our terms of service and privacy policy
                      </p>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
};
