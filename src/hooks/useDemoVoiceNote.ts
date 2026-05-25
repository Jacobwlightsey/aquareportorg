/**
 * Sprint 4B — Voice/Video Note Hook
 *
 * Cross-browser audio recording using MediaRecorder.
 * Safari: audio/mp4, Chrome/Firefox: audio/webm (flag #4 — detect MIME per browser).
 */
import { useCallback, useRef, useState } from "react";

function getPreferredMime(): string {
  // Safari doesn't support webm — use mp4
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return "audio/webm;codecs=opus";
    }
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      return "audio/webm";
    }
    if (MediaRecorder.isTypeSupported("audio/mp4")) {
      return "audio/mp4";
    }
  }
  // Fallback — let browser decide
  return "";
}

function getFileExtension(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("webm")) return "webm";
  return "ogg";
}

export interface VoiceNoteState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  error: string | null;
  mimeType: string;
}

export function useDemoVoiceNote() {
  const [state, setState] = useState<VoiceNoteState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null,
    audioBlob: null,
    error: null,
    mimeType: "",
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getPreferredMime();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      const actualMime = recorder.mimeType || mimeType;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(blob);
        setState((s) => ({
          ...s,
          isRecording: false,
          isPaused: false,
          audioUrl: url,
          audioBlob: blob,
          mimeType: actualMime,
        }));
        clearTimer();
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.onerror = () => {
        setState((s) => ({
          ...s,
          isRecording: false,
          error: "Recording failed. Please try again.",
        }));
        clearTimer();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      // Start recording with 1s timeslice for progressive chunks
      recorder.start(1000);

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          duration: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 500);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUrl: null,
        audioBlob: null,
        error: null,
        mimeType: actualMime,
      });
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access in your browser settings."
          : err.name === "NotFoundError"
            ? "No microphone found. Please connect a microphone."
            : "Could not start recording. Please check your microphone.";
      setState((s) => ({ ...s, error: msg }));
    }
  }, [clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording" || mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      setState((s) => ({ ...s, isPaused: true }));
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      const resumeTime = Date.now();
      const prevDuration = state.duration;
      timerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          isPaused: false,
          duration: prevDuration + Math.floor((Date.now() - resumeTime) / 1000),
        }));
      }, 500);
    }
  }, [state.duration]);

  const discardRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    clearTimer();
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: null,
      audioBlob: null,
      error: null,
      mimeType: "",
    });
  }, [state.audioUrl, clearTimer]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    fileExtension: getFileExtension(state.mimeType),
  };
}
