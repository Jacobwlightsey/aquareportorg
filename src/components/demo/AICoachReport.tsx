/* ──── AI Sales Coach Report ────
   Displays the AI-generated coaching grades, feedback, and tips.
   Used inside DemoReport on the customer detail page.
   ──── */

import {
  Award,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Mic,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { colors } from "@/lib/designTokens";

interface Category {
  name: string;
  grade: string;
  score: number;
  feedback: string;
  tip: string;
}

interface CoachReport {
  overallGrade: string;
  overallScore: number;
  summary: string;
  categories: Category[];
  highlights: string[];
  improvements: string[];
  scriptSuggestion?: string;
}

interface Props {
  status: string | null;
  error: string | null;
  report: CoachReport | null;
  transcript: string | null;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Rapport & Introduction": Star,
  "Discovery & Listening": Target,
  "Education & Data Presentation": BookOpen,
  "Urgency & Health Framing": TrendingUp,
  "Close & Next Steps": Trophy,
  "Pacing & Flow": Brain,
};

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#10b981";
  if (grade.startsWith("B")) return "#3b82f6";
  if (grade.startsWith("C")) return "#f59e0b";
  if (grade.startsWith("D")) return "#f97316";
  return "#ef4444";
}

function ScoreRing({ score, grade, size = 80 }: { score: number; grade: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = gradeColor(grade);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-black leading-none" style={{ color }}>{grade}</span>
        <span className="text-[10px] font-bold mt-0.5" style={{ color: colors.textFaint }}>{score}/100</span>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category.name] ?? Brain;
  const color = gradeColor(category.grade);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}12` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: colors.textPrimary }}>{category.name}</p>
        </div>
        <span className="text-[16px] font-black mr-2" style={{ color }}>{category.grade}</span>
        {expanded ? (
          <ChevronDown className="size-4 shrink-0" style={{ color: colors.textFaint }} />
        ) : (
          <ChevronRight className="size-4 shrink-0" style={{ color: colors.textFaint }} />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Score bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${category.score}%`, background: color }}
            />
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{category.feedback}</p>
          <div className="flex items-start gap-2 rounded-lg p-3" style={{ background: `${colors.warning}08`, border: `1px solid ${colors.warning}15` }}>
            <Lightbulb className="size-4 shrink-0 mt-0.5" style={{ color: colors.warning }} />
            <p className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>{category.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AICoachReport({ status, error, report, transcript }: Props) {
  const [showTranscript, setShowTranscript] = useState(false);

  // Loading states
  if (status === "transcribing") {
    return (
      <div className="rounded-2xl p-6" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin" style={{ color: colors.primary }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Transcribing Audio...</p>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>Analyzing demo recording with Deepgram Nova-2</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "analyzing") {
    return (
      <div className="rounded-2xl p-6" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 animate-pulse" style={{ color: colors.primary }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>AI Coach Analyzing...</p>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>Grading performance across 6 categories</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl p-6" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <XCircle className="size-5" style={{ color: colors.critical }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Coach Analysis Failed</p>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>{error || "Unknown error"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="rounded-2xl p-6 space-y-6" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
            <Award className="size-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>AI Sales Coach</h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>Performance Analysis</p>
          </div>
        </div>
        <ScoreRing score={report.overallScore} grade={report.overallGrade} />
      </div>

      {/* Summary */}
      <div className="rounded-xl p-4" style={{ background: `${gradeColor(report.overallGrade)}06`, border: `1px solid ${gradeColor(report.overallGrade)}15` }}>
        <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{report.summary}</p>
      </div>

      {/* Category grades */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textFaint }}>
          Performance Breakdown
        </p>
        <div className="space-y-2">
          {report.categories.map((cat) => (
            <CategoryCard key={cat.name} category={cat} />
          ))}
        </div>
      </div>

      {/* Highlights */}
      {report.highlights?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="size-4" style={{ color: colors.success }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Highlights</span>
          </div>
          <div className="space-y-2">
            {report.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg p-3" style={{ background: `${colors.success}06`, border: `1px solid ${colors.success}12` }}>
                <span className="text-[12px] mt-px" style={{ color: colors.success }}>✓</span>
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {report.improvements?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4" style={{ color: colors.warning }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Areas to Improve</span>
          </div>
          <div className="space-y-2">
            {report.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg p-3" style={{ background: `${colors.warning}06`, border: `1px solid ${colors.warning}12` }}>
                <span className="text-[12px] mt-px" style={{ color: colors.warning }}>→</span>
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{imp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Script suggestion */}
      {report.scriptSuggestion && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText className="size-4" style={{ color: colors.primary }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Suggested Script</span>
          </div>
          <div className="rounded-xl p-4 italic" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>"{report.scriptSuggestion}"</p>
          </div>
        </div>
      )}

      {/* Transcript toggle */}
      {transcript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer"
            style={{ color: colors.textMuted }}
          >
            <Mic className="size-3.5" />
            {showTranscript ? "Hide Transcript" : "View Full Transcript"}
            {showTranscript ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
          {showTranscript && (
            <div className="mt-3 rounded-xl p-4 max-h-64 overflow-y-auto" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
