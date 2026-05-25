/**
 * Sprint 4B — Voice Note recorder widget for DemoDealerClose.
 *
 * Inline component: record → preview → attach to demo session.
 */
import {
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Check,
} from "lucide-react";
import { useDemoVoiceNote } from "@/hooks/useDemoVoiceNote";

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

  // Already recorded — show preview
  if (voice.audioUrl && voice.audioBlob) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Voice Note ({formatTime(voice.duration)})
        </p>
        <audio src={voice.audioUrl} controls className="w-full h-10" />
        <div className="flex gap-2">
          <button
            onClick={voice.discardRecording}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            Discard
          </button>
          <button
            onClick={() => onAttach(voice.audioBlob!, voice.mimeType)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500 cursor-pointer"
          >
            <Check className="size-3.5" />
            Attach to Demo
          </button>
        </div>
      </div>
    );
  }

  // Recording in progress
  if (voice.isRecording) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            {!voice.isPaused && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            )}
            <span className="relative inline-flex size-3 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-mono font-bold">
            {formatTime(voice.duration)}
          </span>
          <span className="text-xs text-white/40">
            {voice.isPaused ? "Paused" : "Recording…"}
          </span>
        </div>
        <div className="flex gap-2">
          {voice.isPaused ? (
            <button
              onClick={voice.resumeRecording}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15 cursor-pointer"
            >
              <Play className="size-3.5" />
              Resume
            </button>
          ) : (
            <button
              onClick={voice.pauseRecording}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15 cursor-pointer"
            >
              <Pause className="size-3.5" />
              Pause
            </button>
          )}
          <button
            onClick={voice.stopRecording}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold hover:bg-red-500 cursor-pointer"
          >
            <Square className="size-3.5" />
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Idle — show record button
  return (
    <div className="space-y-2">
      <button
        onClick={voice.startRecording}
        className="w-full flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10 cursor-pointer"
      >
        <Mic className="size-4 text-red-400 shrink-0" />
        Record Voice Note
      </button>
      {voice.error && (
        <p className="text-xs text-red-400 px-1">{voice.error}</p>
      )}
    </div>
  );
}
