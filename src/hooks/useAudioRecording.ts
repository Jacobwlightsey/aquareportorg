/* ──── useAudioRecording ────
   MediaRecorder hook for demo voice capture.
   Returns start/stop controls and a Blob of the recording.
   Uses webm/opus for best compression + browser support.
   ──── */

import { useCallback, useRef, useState } from "react";

export interface AudioRecordingState {
  /** Whether we're actively recording */
  isRecording: boolean;
  /** Whether the browser supports audio recording */
  isSupported: boolean;
  /** The finished recording as a Blob, or null */
  audioBlob: Blob | null;
  /** Duration of the recording in seconds */
  durationSeconds: number;
  /** Any error that occurred */
  error: string | null;
  /** Start recording (requests mic permission) */
  startRecording: () => Promise<void>;
  /** Stop recording and return the blob */
  stopRecording: () => void;
  /** Clear the recording blob */
  clearRecording: () => void;
}

export function useAudioRecording(): AudioRecordingState {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!window.MediaRecorder;

  // Pick the best supported MIME type
  const getMimeType = useCallback(() => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Audio recording not supported in this browser");
      return;
    }

    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Deepgram-optimal
        },
      });
      streamRef.current = stream;

      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000, // Low bitrate for speech
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setDurationSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));

        // Clean up stream tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.onerror = () => {
        setError("Recording failed");
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start(5000); // Collect chunks every 5s
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow mic access and try again.");
      } else {
        setError(err.message || "Failed to start recording");
      }
    }
  }, [isSupported, getMimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setDurationSeconds(0);
    setError(null);
  }, []);

  return {
    isRecording,
    isSupported,
    audioBlob,
    durationSeconds,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
