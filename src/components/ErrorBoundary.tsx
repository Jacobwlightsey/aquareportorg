import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Parse a user-friendly message from Convex or generic errors */
function friendlyMessage(error: Error | null): { title: string; description: string } {
  if (!error) return { title: "Something went wrong", description: "An unexpected error occurred." };

  const msg = error.message || "";

  // Convex-specific errors
  if (msg.includes("Not authenticated") || msg.includes("Unauthenticated")) {
    return {
      title: "Session Expired",
      description: "Your session has expired. Please log in again to continue.",
    };
  }
  if (msg.includes("not found") || msg.includes("Not found") || msg.includes("does not exist")) {
    return {
      title: "Not Found",
      description: "The page or record you're looking for doesn't exist or has been removed.",
    };
  }
  if (msg.includes("rate limit") || msg.includes("Too many")) {
    return {
      title: "Too Many Requests",
      description: "You're making requests too quickly. Please wait a moment and try again.",
    };
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("Failed to fetch")) {
    return {
      title: "Connection Error",
      description: "Unable to connect to the server. Please check your internet connection and try again.",
    };
  }
  if (msg.includes("permission") || msg.includes("forbidden") || msg.includes("Access denied")) {
    return {
      title: "Access Denied",
      description: "You don't have permission to view this content. Contact your admin if you think this is a mistake.",
    };
  }
  if (msg.includes("PDF_PROVIDER_NOT_CONFIGURED") || msg.includes("PDF generation")) {
    return {
      title: "PDF Service Unavailable",
      description: "The PDF generation service is temporarily unavailable. Please try again in a few minutes.",
    };
  }

  // Generic
  return {
    title: "Something Went Wrong",
    description: "We ran into an unexpected issue. Our team has been notified and is looking into it.",
  };
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      const { title, description } = friendlyMessage(this.state.error);
      const errorId = Math.random().toString(36).slice(2, 8).toUpperCase();

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-[#0a0e1a]">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="size-8 text-red-400" />
            </div>

            {/* Title & Description */}
            <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
              {description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                  "bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer",
                )}
              >
                <RefreshCw className="size-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                  "bg-muted/10 text-muted-foreground border border-border hover:bg-muted/20 transition-colors cursor-pointer",
                )}
              >
                <Home className="size-4" />
                Go to Dashboard
              </button>
            </div>

            {/* Error reference */}
            <div className="mt-8 pt-6 border-t border-border w-full">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <HelpCircle className="size-3" />
                <span>
                  If this keeps happening, contact support with reference{" "}
                  <span className="font-mono text-muted-foreground">{errorId}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
