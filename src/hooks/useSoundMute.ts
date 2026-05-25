import { createContext, useContext, useCallback, useState } from "react";

/** Global mute state for demo sounds + haptic feedback */
export interface SoundMuteState {
  isMuted: boolean;
  toggleMute: () => void;
}

export const SoundMuteContext = createContext<SoundMuteState>({
  isMuted: false,
  toggleMute: () => {},
});

export function useSoundMuteProvider(): SoundMuteState {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("demo_muted") === "true";
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("demo_muted", String(next));
      } catch {}
      return next;
    });
  }, []);

  return { isMuted, toggleMute };
}

export function useSoundMute() {
  return useContext(SoundMuteContext);
}
