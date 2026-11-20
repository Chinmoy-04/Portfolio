"use client";

import { useSyncExternalStore } from "react";
import { sound } from "@/engine/sound";

const subscribe = (onChange: () => void) => {
  sound.start();
  return sound.subscribe(onChange);
};

/* Sound on or off, in the pinned nav. On by default; on phones only the dot shows. */
export function SoundToggle() {
  const on = useSyncExternalStore(
    subscribe,
    () => sound.enabled,
    () => false,
  );

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Sound"
      onClick={() => sound.toggle()}
      className="btn btn-ghost gap-2 px-3"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${on ? "bg-accent" : "border-dim border"}`}
      />
      <span className="hidden sm:inline">Sound</span>
    </button>
  );
}
