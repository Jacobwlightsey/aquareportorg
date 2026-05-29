import { Link } from "react-router-dom";
import { SignUp } from "@/components/SignUp";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export function SignupPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative">
      <SEO
        title="Sign Up Free — AquaReport Water Quality Report Software"
        description="Create your free AquaReport dealer account. Generate professional, branded water quality reports with AquaScore™ and close more water treatment sales."
        canonical="https://aquareport.org/signup"
        noindex
      />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center mb-4">
            <svg className="size-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">
            Get 1 free report when you create your company
          </p>
        </div>

        <SignUp />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0 h-auto font-medium" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
