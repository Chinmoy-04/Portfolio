"use client";

import { useSyncExternalStore } from "react";
import { sound } from "@/engine/sound";

const subscribe = (onChange: () => void) => {
  sound.start();
  return sound.subscribe(onChange);
};

/* Sound on or off, in the pinned nav. Off by default (PLAN.md, section 7.6). */
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
      onClick={() => sound.toggle()}
      className="btn btn-ghost gap-2 px-3"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${on ? "bg-accent" : "border-dim border"}`}
      />
      Sound
    </button>
  );
}
