import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Component, type ReactNode, type ErrorInfo } from "react";

/* ──── Sprint 1G: Per-section error & loading wrapper ──── */

interface Props {
  children: ReactNode;
  /** Step key for error messages */
  stepName?: string;
  /** Show loading skeleton while data resolves */
  isLoading?: boolean;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

/** Error boundary + loading state for every demo step */
export class DemoStepWrapper extends Component<Props, ErrorState> {
  state: ErrorState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[DemoStep:${this.props.stepName ?? "unknown"}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    // Error state
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg pt-12 text-center space-y-4">
          <AlertTriangle className="size-10 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold">Something went wrong</h3>
            <p className="text-sm text-white/50 mt-1">
              {this.props.stepName
                ? `Error in the "${this.props.stepName}" section`
                : "An error occurred loading this step"}
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-white/30 mt-2 font-mono">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
        </div>
      );
    }

    // Loading state
    if (this.props.isLoading) {
      return (
        <div className="mx-auto max-w-lg pt-12 text-center space-y-4">
          <Loader2 className="size-8 text-cyan-400 mx-auto animate-spin" />
          <p className="text-sm text-white/40">Loading…</p>
        </div>
      );
    }

    return this.props.children;
  }
}
