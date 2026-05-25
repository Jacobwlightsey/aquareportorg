/* ──── Voice Note recorder — designTokens ──── */

import { Mic, Pause, Play, Square, Trash2, Check } from "lucide-react";
import { useDemoVoiceNote } from "@/hooks/useDemoVoiceNote";
import { colors } from "@/lib/designTokens";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  onAttach: (blob: Blob, mimeType: string) => void;
}

export function DemoVoiceNote({ onAttach }: Props) {
  const voice = useDemoVoiceNote();

  // Preview
  if (voice.audioUrl && voice.audioBlob) {
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ background: colors.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textFaint }}>
          Voice Note ({formatTime(voice.duration)})
        </p>
        <audio src={voice.audioUrl} controls className="w-full h-10" />
        <div className="flex gap-2">
          <button onClick={voice.discardRecording} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] cursor-pointer" style={{ background: `${colors.textFaint}08`, color: colors.textMuted }}>
            <Trash2 className="size-3.5" />Discard
          </button>
          <button onClick={() => onAttach(voice.audioBlob!, voice.mimeType)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold cursor-pointer" style={{ background: colors.success }}>
            <Check className="size-3.5" />Attach to Demo
          </button>
        </div>
      </div>
    );
  }

  // Recording
  if (voice.isRecording) {
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ background: `${colors.critical}06`, border: `1px solid ${colors.critical}20` }}>
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            {!voice.isPaused && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: colors.critical }} />}
            <span className="relative inline-flex size-3 rounded-full" style={{ background: colors.critical }} />
          </span>
          <span className="text-[14px] font-mono font-bold">{formatTime(voice.duration)}</span>
          <span className="text-[12px]" style={{ color: colors.textFaint }}>{voice.isPaused ? "Paused" : "Recording…"}</span>
        </div>
        <div className="flex gap-2">
          {voice.isPaused ? (
            <button onClick={voice.resumeRecording} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ background: colors.surface }}>
              <Play className="size-3.5" />Resume
            </button>
          ) : (
            <button onClick={voice.pauseRecording} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ background: colors.surface }}>
              <Pause className="size-3.5" />Pause
            </button>
          )}
          <button onClick={voice.stopRecording} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold cursor-pointer" style={{ background: colors.critical }}>
            <Square className="size-3.5" />Stop
          </button>
        </div>
      </div>
    );
  }

  // Idle
  return (
    <div className="space-y-2">
      <button onClick={voice.startRecording} className="w-full flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer" style={{ background: colors.surface, color: colors.textSecondary }}>
        <Mic className="size-4 shrink-0" style={{ color: colors.critical }} />Record Voice Note
      </button>
      {voice.error && <p className="text-[12px] px-1" style={{ color: colors.critical }}>{voice.error}</p>}
    </div>
  );
}
