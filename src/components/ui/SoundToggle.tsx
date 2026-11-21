"use client";

import { useSyncExternalStore } from "react";
import { sound } from "@/engine/sound";

const subscribe = (onChange: () => void) => {
  sound.start();
  return sound.subscribe(onChange);
};

/* Sound on or off, in the pinned nav. On by default; hidden on phones, which have no sound. */
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
      className="btn btn-ghost gap-2 px-3 max-sm:hidden!"
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${on ? "bg-accent" : "border-dim border"}`}
      />
      <span>Sound</span>
    </button>
  );
}
