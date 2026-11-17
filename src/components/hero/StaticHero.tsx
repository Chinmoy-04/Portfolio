import { AsciiSample } from "@/components/specimen/AsciiSample";
import { profile } from "@/content/profile";

/*
  Phase 1 hero: plain HTML, no WebGL. The headline stays as real text in every
  later phase; the particle canvas (phases 3 to 5) replaces only the ASCII
  poster behind it.
*/
export function StaticHero() {
  const [first, ...rest] = profile.name.split(" ");

  return (
    <section
      id="top"
      aria-label="Introduction"
      className="relative mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end overflow-hidden px-[var(--gutter)] pt-[calc(var(--nav-h)+2rem)] pb-12 lg:pb-16"
    >
      {/* Stand-in for the particle canvas */}
      <div className="pointer-events-none absolute inset-x-0 top-[var(--nav-h)] bottom-1/3 flex items-center justify-center opacity-70 lg:justify-end lg:pr-[var(--gutter)]">
        <AsciiSample className="text-[7px] sm:text-[9px] lg:text-[11px] xl:text-[12px]" />
      </div>

      <h1 className="hero-name relative">
        {first}
        <br />
        {rest.join(" ")}
      </h1>

      <div className="relative mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-[34ch] text-lg leading-snug lg:text-xl">{profile.roleLine}</p>
        {/* "View projects" lives in the pinned top bar, so the hero does not repeat it. */}
        <p className="type-mono text-muted max-w-[44ch] lg:text-right">
          <span className="text-accent">Open to Werkstudent and internship roles.</span>
          <br />
          {profile.location}
        </p>
      </div>
    </section>
  );
}
