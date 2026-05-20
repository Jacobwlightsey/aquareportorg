import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Step =
  | "signIn"
  | { type: "forgot"; email?: string }
  | { type: "reset-code"; email: string }
  | { type: "new-password"; email: string; code: string };

export function SignIn() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [step, setStep] = useState<Step>("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingSession, setAwaitingSession] = useState(false);
  const [resetResendSeconds, setResetResendSeconds] = useState(0);

  useEffect(() => {
    if (awaitingSession && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [awaitingSession, isAuthenticated, navigate, redirect]);

  useEffect(() => {
    if (!awaitingSession || isAuthenticated) return;
    const id = window.setTimeout(() => {
      setAwaitingSession(false);
      setLoading(false);
      setError("Sign-in worked, but this browser did not finish saving the session. Please try once more.");
    }, 10000);
    return () => window.clearTimeout(id);
  }, [awaitingSession, isAuthenticated]);

  useEffect(() => {
    if (resetResendSeconds <= 0) return;
    const id = window.setTimeout(() => setResetResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [resetResendSeconds]);

  if (step === "signIn") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);

              const formData = new FormData(e.currentTarget);
              const email = String(formData.get("email") || "").trim().toLowerCase();
              formData.set("email", email);
              try {
                const result = await signIn("password", formData);
                if (result.signingIn) {
                  setAwaitingSession(true);
                } else {
                  setError("Invalid email or password");
                }
              } catch {
                setError("Invalid email or password");
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setStep({ type: "forgot" })}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11"
                required
              />
            </div>
            <input name="flow" value="signIn" type="hidden" />
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-11" disabled={loading || awaitingSession}>
              {(loading || awaitingSession) && <Loader2 className="size-4 animate-spin" />}
              {awaitingSession ? "Opening dashboard..." : loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step.type === "forgot") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="font-semibold text-lg">Reset Password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive a reset code
            </p>
          </div>
          <form
            onSubmit={async e => {
              e.preventDefault();
              setError("");
              setLoading(true);

              const formData = new FormData(e.currentTarget);
              const email = String(formData.get("email") || "").trim().toLowerCase();
              formData.set("email", email);
              try {
                await signIn("password", formData);
                setStep({ type: "reset-code", email });
                setResetResendSeconds(60);
              } catch {
                setError("Could not send reset code. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={step.email}
                autoComplete="email"
                className="h-11"
                required
              />
            </div>
            <input name="flow" value="reset" type="hidden" />
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("signIn")}
            >
              <ArrowLeft className="size-4" />
              Back to sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step.type === "reset-code") {
    return (
      <Card variant="elevated">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto size-12 rounded-full bg-primary flex items-center justify-center mb-4">
              <Mail className="size-6 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-lg">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a code to {step.email}
            </p>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              setError("");
              const formData = new FormData(e.currentTarget);
              const code = String(formData.get("code") || "").trim();
              if (!code) {
                setError("Enter the reset code from your email.");
                return;
              }
              setStep({ type: "new-password", email: step.email, code });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Reset Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder="Enter code"
                autoComplete="one-time-code"
                className="h-11 text-center tracking-[0.5em] font-mono"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-11">
              Continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading || resetResendSeconds > 0}
              onClick={async () => {
                setError("");
                setLoading(true);
                const formData = new FormData();
                formData.set("email", step.email);
                formData.set("flow", "reset");
                try {
                  await signIn("password", formData);
                  setResetResendSeconds(60);
                } catch {
                  setError("Could not resend reset code. Please wait a moment and try again.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {resetResendSeconds > 0 ? `Resend code in ${resetResendSeconds}s` : "Resend code"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="font-semibold text-lg">Set New Password</h2>
          <p className="text-sm text-muted-foreground">
            Choose a strong password
          </p>
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);

            const formData = new FormData(e.currentTarget);
            formData.set("email", step.email.trim().toLowerCase());
            formData.set("code", step.code.trim());
            try {
              const result = await signIn("password", formData);
              if (result.signingIn) {
                setAwaitingSession(true);
              } else {
                setError("Could not reset password. Please try signing in.");
              }
            } catch {
              setError("Could not reset password. The code may be invalid or expired.");
              setStep({ type: "reset-code", email: step.email });
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
              className="h-11"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>
          <input name="flow" value="reset-verification" type="hidden" />
          <input name="email" value={step.email} type="hidden" />
          <input name="code" value={step.code} type="hidden" />
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full h-11" disabled={loading || awaitingSession}>
            {(loading || awaitingSession) && <Loader2 className="size-4 animate-spin" />}
            {awaitingSession ? "Opening dashboard..." : loading ? "Resetting..." : "Reset Password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("signIn")}
          >
            <ArrowLeft className="size-4" />
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
