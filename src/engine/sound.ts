/*
  Hero sound (PLAN.md, section 7.6). Synthesised in the browser, no files.

  A soft band of filtered noise sits under the hero. As particles gather the
  band narrows and rises, so the noise starts to sound like a pitch; when an
  emblem locks, a short tone plays. On by default (changed from off on
  20 Nov 2026); turning it off is remembered. Under reduced motion it starts
  off, and must be turned on again each visit.

  Browsers refuse to start audio before the visitor clicks, taps or presses a
  key (scrolling does not count), so until the audio is actually running,
  every such gesture tries again. The opening's Enter button (Hero.tsx) is
  that gesture, so the opening can have sound:
    riser     a soft tone that climbs with the loading counter
    dissolve  a falling shimmer and a low chord as the digits turn to particles
*/

const STORAGE_KEY = "sound";
/** Events that let a page start audio. Touch counts on release, not on press. */
const GESTURES = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;
/** Bed level at full presence. Kept well under the chime. */
const BED_GAIN = 0.05;
const CHIME_GAIN = 0.07;
/** One tone per chapter, a pentatonic run so any order sounds fine */
const CHIME_HZ = [440, 494, 554, 659, 740, 880, 988];
const RISER_GAIN = 0.035;
const DISSOLVE_GAIN = 0.08;

/** Phones get no sound at all: same width as Tailwind's `sm` breakpoint. */
const isPhone = () => window.matchMedia("(max-width: 639px)").matches;

type Listener = (on: boolean) => void;

class Sound {
  private on = false;
  private listeners = new Set<Listener>();
  private ctx: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private bed: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private riserNodes: { osc: OscillatorNode; gain: GainNode } | null = null;
  private gather = 0;
  private presence = 0;
  private started = false;

  /** Reads the remembered choice. Call once on the client. */
  start() {
    if (this.started) return;
    this.started = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let remembered: string | null = null;
    try {
      remembered = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!reduce && remembered !== "off") this.set(true, { remember: false });
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  get enabled() {
    return this.on;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** The visitor's answer to the opening's Enter button. Called from the click. */
  choose(on: boolean) {
    this.set(on, { remember: true });
    if (on && !isPhone()) this.ensureContext();
  }

  /** Counter opening: a tone that climbs with the count. progress is 0 to 1. */
  riser(progress: number) {
    const ctx = this.ctx;
    if (!this.on || !ctx) return;
    if (!this.riserNodes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      this.riserNodes = { osc, gain };
    }
    const t = ctx.currentTime;
    // Two octaves, 110 to 440 Hz, getting a little louder on the way up.
    this.riserNodes.osc.frequency.setTargetAtTime(110 * 2 ** (progress * 2), t, 0.05);
    this.riserNodes.gain.gain.setTargetAtTime(RISER_GAIN * (0.3 + 0.7 * progress), t, 0.05);
  }

  /** Fades the riser out. */
  riserStop() {
    const nodes = this.riserNodes;
    if (!nodes || !this.ctx) return;
    this.riserNodes = null;
    const t = this.ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(t);
    nodes.gain.gain.setTargetAtTime(0, t, 0.08);
    nodes.osc.stop(t + 0.6);
  }

  /** Counter opening: the digits at 100 break into particles. About 2 s. */
  dissolve() {
    const ctx = this.ctx;
    if (!this.on || !ctx || !this.noise) return;
    // Scheduled even if the context is still starting; it plays once it runs.
    const t = ctx.currentTime + 0.02;

    // Noise through a band that falls from bright to low: the digits scattering.
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(4200, t);
    band.frequency.exponentialRampToValueAtTime(260, t + 1.6);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(DISSOLVE_GAIN, t + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    src.connect(band).connect(env).connect(ctx.destination);
    src.start(t);
    src.stop(t + 1.9);

    // A low, open chord underneath, where the riser left off: the field settling.
    for (const [hz, level] of [
      [110, 1],
      [165, 0.6],
      [220, 0.4],
    ]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(DISSOLVE_GAIN * 0.5 * level, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.5);
    }
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
    if (on && isPhone()) return;
    if (on === this.on) return;
    this.on = on;
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
      } catch {}
    }
    if (on) this.waitForGesture();
    this.applyBed();
    this.listeners.forEach((l) => l(on));
  }

  /** Retries starting the audio on every gesture until it is running. */
  private waitForGesture() {
    const unlock = () => {
      if (!this.on) return stop();
      this.ensureContext();
      if (this.ctx?.state === "running") stop();
      // resume() settles after the gesture, so check again once it has.
      else void this.ctx?.resume().then(() => this.ctx?.state === "running" && stop());
    };
    const stop = () => GESTURES.forEach((e) => window.removeEventListener(e, unlock, true));
    GESTURES.forEach((e) => window.addEventListener(e, unlock, true));
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
    this.noise = buffer;
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
