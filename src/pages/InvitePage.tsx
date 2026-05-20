import { useConvexAuth, useMutation } from "convex/react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export function InvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const acceptInvite = useMutation(api.companies.acceptInvite);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !isAuthenticated || accepting || accepted) return;
    setAccepting(true);
    setError("");
    acceptInvite({ token })
      .then(() => {
        setAccepted(true);
        toast.success("Invite accepted");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not accept invite");
      })
      .finally(() => setAccepting(false));
  }, [acceptInvite, accepting, accepted, isAuthenticated, navigate, token]);

  const redirect = encodeURIComponent(`/invite?token=${token}`);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-blue-500/10">
            {accepted ? <CheckCircle2 className="size-6 text-emerald-500" /> : <Mail className="size-6 text-blue-500" />}
          </div>
          <CardTitle>Team Invite</CardTitle>
          <CardDescription>
            {token ? "Accept your AquaReport company invitation." : "This invite link is missing a token."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {!token && <p className="text-sm text-destructive">Ask your admin to send a new invite.</p>}
          {token && isLoading && <Loader2 className="mx-auto size-6 animate-spin text-blue-500" />}
          {token && !isLoading && !isAuthenticated && (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in or create an account with the email address this invite was sent to.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild>
                  <Link to={`/login?redirect=${redirect}`}>Sign In</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/signup?redirect=${redirect}`}>Create Account</Link>
                </Button>
              </div>
            </>
          )}
          {token && isAuthenticated && accepting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Accepting invite...
            </div>
          )}
          {accepted && <p className="text-sm text-emerald-600">Invite accepted. Opening your dashboard...</p>}
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
