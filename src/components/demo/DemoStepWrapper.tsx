/* ──── Step Wrapper — Error boundary + loading ────
   designTokens colors.
   ──── */

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Component, type ReactNode, type ErrorInfo } from "react";
import { colors } from "@/lib/designTokens";

interface Props {
  children: ReactNode;
  stepName?: string;
  isLoading?: boolean;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

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
    if (this.state.hasError) {
      return (
        <div className="mx-auto w-full max-w-5xl px-8 pt-12 text-center space-y-4">
          <AlertTriangle className="size-10 mx-auto" style={{ color: colors.warning }} />
          <div>
            <h3 className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>Something went wrong</h3>
            <p className="text-[14px] mt-1" style={{ color: colors.textMuted }}>
              {this.props.stepName
                ? `Error in the "${this.props.stepName}" section`
                : "An error occurred loading this step"}
            </p>
            {this.state.error?.message && (
              <p className="text-[12px] mt-2 font-mono" style={{ color: colors.textFaint }}>
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-medium transition-colors cursor-pointer"
            style={{ background: colors.surface, color: colors.textSecondary }}
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
        </div>
      );
    }

    if (this.props.isLoading) {
      return (
        <div className="mx-auto w-full max-w-5xl px-8 pt-12 text-center space-y-4">
          <Loader2 className="size-8 mx-auto animate-spin" style={{ color: colors.primary }} />
          <p className="text-[14px]" style={{ color: colors.textFaint }}>Loading…</p>
        </div>
      );
    }

    return this.props.children;
  }
}
