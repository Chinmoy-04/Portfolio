/*
  Hero sound (PLAN.md, section 7.6). Synthesised in the browser, no files.

  A soft band of filtered noise sits under the hero. As particles gather the
  band narrows and rises, so the noise starts to sound like a pitch; when an
  emblem locks, a short tone plays. Off by default; the visitor's choice is
  remembered, except under reduced motion, where it must be turned on again
  each visit.

  The audio graph is built on the first user gesture after sound is turned
  on, since browsers refuse to start audio before one.
*/

const STORAGE_KEY = "sound";
/** Bed level at full presence. Kept well under the chime. */
const BED_GAIN = 0.05;
const CHIME_GAIN = 0.07;
/** One tone per chapter, a pentatonic run so any order sounds fine */
const CHIME_HZ = [440, 494, 554, 659, 740, 880, 988];

type Listener = (on: boolean) => void;

class Sound {
  private on = false;
  private listeners = new Set<Listener>();
  private ctx: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private bed: GainNode | null = null;
  private gather = 0;
  private presence = 0;
  private started = false;

  /** Reads the remembered choice. Call once on the client. */
  start() {
    if (this.started) return;
    this.started = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let remembered = false;
    try {
      remembered = localStorage.getItem(STORAGE_KEY) === "on";
    } catch {}
    if (remembered && !reduce) this.set(true, { remember: false });
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  get enabled() {
    return this.on;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** Called from a click, so the audio context may start right away. */
  toggle() {
    this.set(!this.on, { remember: true });
    if (this.on) this.ensureContext();
  }

  /**
   * gather: 0 = chaos, 1 = emblem complete. presence: 0 = hero off screen or
   * field faded out, 1 = fully present. Cheap to call every scroll frame.
   */
  update(gather: number, presence: number) {
    this.gather = gather;
    this.presence = presence;
    this.applyBed();
  }

  /** The tone for an emblem locking into place. */
  chime(chapter: number) {
    const ctx = this.ctx;
    if (!this.on || !ctx || ctx.state !== "running" || this.presence < 0.1) return;
    const t = ctx.currentTime;
    const hz = CHIME_HZ[chapter % CHIME_HZ.length];
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(CHIME_GAIN * this.presence, t + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    env.connect(ctx.destination);
    // A sine and a quiet fifth above, for a glassy, not beepy, tone.
    for (const [mult, level] of [
      [1, 1],
      [1.5, 0.25],
    ]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = hz * mult;
      g.gain.value = level;
      osc.connect(g).connect(env);
      osc.start(t);
      osc.stop(t + 1.5);
    }
  }

  private set(on: boolean, { remember }: { remember: boolean }) {
    if (on === this.on) return;
    this.on = on;
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
      } catch {}
    }
    if (on && !this.ctx) {
      // Remembered "on": wait for the first gesture before building audio.
      const first = () => {
        window.removeEventListener("pointerdown", first);
        window.removeEventListener("keydown", first);
        if (this.on) this.ensureContext();
      };
      window.addEventListener("pointerdown", first);
      window.addEventListener("keydown", first);
    }
    this.applyBed();
    this.listeners.forEach((l) => l(on));
  }

  private ensureContext() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;

    // Two seconds of white noise, looped.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "bandpass";
    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    noise.connect(this.filter).connect(this.bed).connect(ctx.destination);
    noise.start();
    this.applyBed();
  }

  private applyBed() {
    const { ctx, filter, bed } = this;
    if (!ctx || !filter || !bed) return;
    const t = ctx.currentTime;
    const g = this.gather;
    // Wide and low in chaos, narrow and higher as the emblem forms.
    filter.frequency.setTargetAtTime(320 + g * 560, t, 0.08);
    filter.Q.setTargetAtTime(0.7 + g * g * 18, t, 0.08);
    // A narrow band is quieter, so lift it a little to keep the level even.
    const level = this.on ? BED_GAIN * this.presence * (1 + g * 1.5) : 0;
    bed.gain.setTargetAtTime(level, t, 0.15);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (this.on) void this.ctx.resume();
  };
}

export const sound = new Sound();
