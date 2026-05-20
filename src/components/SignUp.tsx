import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid password")) {
    return "Password must be at least 8 characters.";
  }
  if (message.includes("resend_api_key")) {
    return "Email sending is not configured yet. Please try again in a moment.";
  }
  if (message.includes("failed to send email")) {
    return "We could not send the verification email yet. Please try again in a moment.";
  }
  return "Could not create account. Please try again.";
}

type Step = "signUp" | { email: string };

export function SignUp() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/company";
  const [step, setStep] = useState<Step>("signUp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingSession, setAwaitingSession] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (step === "signUp") return;
    setResendSeconds(60);
  }, [step]);

  useEffect(() => {
    if (step === "signUp" || resendSeconds <= 0) return;
    const id = window.setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendSeconds, step]);

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
      setError("Your account was verified, but this browser did not finish saving the session. Please sign in again.");
    }, 10000);
    return () => window.clearTimeout(id);
  }, [awaitingSession, isAuthenticated]);

  if (step === "signUp") {
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
                  setStep({ email });
                }
              } catch (error) {
                const retry = new FormData();
                retry.set("flow", "email-verification");
                retry.set("email", email);
                try {
                  await signIn("password", retry);
                  setStep({ email });
                  return;
                } catch {
                  setError(authErrorMessage(error));
                }
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                className="h-11"
                required
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
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
            <input name="flow" value="signUp" type="hidden" />
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full h-11" disabled={loading || awaitingSession}>
              {(loading || awaitingSession) && <Loader2 className="size-4 animate-spin" />}
              {awaitingSession ? "Opening setup..." : loading ? "Creating account..." : "Create Account"}
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
          <div className="mx-auto size-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Mail className="size-6 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-lg">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to {step.email}
          </p>
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);

            const formData = new FormData(e.currentTarget);
            const code = String(formData.get("code") || "").trim();
            formData.set("code", code);
            formData.set("email", step.email.trim().toLowerCase());
            try {
              const result = await signIn("password", formData);
              if (result.signingIn) {
                setAwaitingSession(true);
              } else {
                setError("We verified the code, but the session did not start. Please request a new code and try again.");
              }
            } catch {
              setError("Invalid or expired code. Please request a new code and try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              placeholder="Enter code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className="h-11 text-center tracking-[0.5em] font-mono"
              required
            />
          </div>
          <input name="flow" value="email-verification" type="hidden" />
          <input name="email" value={step.email} type="hidden" />
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full h-11" disabled={loading || awaitingSession}>
            {(loading || awaitingSession) && <Loader2 className="size-4 animate-spin" />}
            {awaitingSession ? "Opening setup..." : loading ? "Verifying..." : "Verify Email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={loading || resendSeconds > 0}
            onClick={async () => {
              setError("");
              setLoading(true);
              const formData = new FormData();
              formData.set("flow", "email-verification");
              formData.set("email", step.email.trim().toLowerCase());
              try {
                await signIn("password", formData);
                setResendSeconds(60);
              } catch {
                setError("Could not resend code. Please wait a moment and try again.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("signUp")}
          >
            <ArrowLeft className="size-4" />
            Back to sign up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
