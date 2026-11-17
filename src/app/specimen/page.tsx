import type { Metadata } from "next";
import { AsciiSample } from "@/components/specimen/AsciiSample";
import { profile } from "@/content/profile";
import { domainLabels, projects } from "@/content/projects";
import { siteConfig, type AccentName } from "@/content/site.config";

export const metadata: Metadata = {
  title: "Specimen",
  robots: { index: false },
};

const ACCENTS: { name: AccentName; label: string; hex: string; note: string }[] = [
  {
    name: "amber",
    label: "Amber",
    hex: "#FFB020",
    note: "Inspection light. Proposed.",
  },
  {
    name: "green",
    label: "Signal green",
    hex: "#3DDC84",
    note: "Terminal and detection boxes.",
  },
  {
    name: "blue",
    label: "Electric blue",
    hex: "#58A6FF",
    note: "Matches your GitHub README.",
  },
];

const NEUTRALS = [
  { token: "bg", hex: "#0A0B0D", use: "Page background" },
  { token: "surface", hex: "#111317", use: "Raised areas" },
  { token: "line", hex: "#23262D", use: "Dividers" },
  { token: "dim", hex: "#5A5F68", use: "Quiet glyphs" },
  { token: "muted", hex: "#8B9099", use: "Secondary text" },
  { token: "text", hex: "#E9EAEC", use: "Primary text" },
];

const sample = projects[0];

export default function SpecimenPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-[var(--gutter)] pb-32">
      <header className="border-line border-b pt-16 pb-12">
        <p className="type-label text-muted">Phase 0 specimen. Not part of the public site.</p>
        <h1 className="type-display mt-6 break-words">{profile.name}</h1>
        <p className="text-muted mt-6 max-w-[52ch] text-lg">{profile.roleLine}</p>
      </header>

      {/* Accent comparison: the one decision to make on this page */}
      <section className="pt-16">
        <h2 className="type-h2">Pick the accent</h2>
        <p className="text-muted mt-3 max-w-[65ch]">
          The same hero fragment, button, link and project row in each candidate. The accent marks
          the signal inside the noise: the flagged patch, the active chapter, the links.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-px bg-[var(--line)] lg:grid-cols-3">
          {ACCENTS.map((accent) => (
            <article key={accent.name} data-accent={accent.name} className="bg-bg p-6 lg:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="type-h2">{accent.label}</h3>
                <span className="type-label text-accent">{accent.hex}</span>
              </div>
              <p className="type-mono text-muted mt-1">
                {accent.note}
                {accent.name === siteConfig.accent ? " Currently set." : ""}
              </p>

              <div className="bg-surface mt-6 flex justify-center py-6">
                <AsciiSample />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="bg-accent text-on-accent type-label px-4 py-3 font-bold">
                  View projects
                </span>
                <span className="type-label border-line border px-4 py-3">CV</span>
                <span className="type-mono text-accent underline underline-offset-4">
                  live demo
                </span>
              </div>

              <div className="border-line mt-8 border-t pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="type-h2">{sample.name}</span>
                  <span className="type-label text-accent">{domainLabels[sample.domain]}</span>
                </div>
                <p className="text-muted mt-2">{sample.oneLine}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {sample.stack.map((item) => (
                    <li key={item} className="type-label border-line text-muted border px-2 py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chapter rail sample: seven ticks, the third one active */}
              <div className="mt-8 flex items-center gap-2" aria-hidden="true">
                {projects.map((p, i) => (
                  <span
                    key={p.slug}
                    className={i === 2 ? "bg-accent h-1 w-10" : "bg-line h-px w-6"}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Type */}
      <section className="pt-24">
        <h2 className="type-h2">Type</h2>
        <p className="text-muted mt-3 max-w-[65ch]">
          Archivo at heavy weight and wide width for headlines, at regular weight for reading.
          JetBrains Mono for labels, metadata and readouts.
        </p>

        <div className="border-line mt-10 grid grid-cols-1 gap-x-10 gap-y-8 border-t pt-8 lg:grid-cols-[10rem_1fr]">
          <span className="type-label text-muted">Display</span>
          <p className="type-display break-words">Signal from noise</p>

          <span className="type-label text-muted">Heading 1</span>
          <p className="type-h1">Selected projects</p>

          <span className="type-label text-muted">Heading 2</span>
          <p className="type-h2">Air Gesture Controller</p>

          <span className="type-label text-muted">Body</span>
          <p className="max-w-[65ch]">{projects[1].summary}</p>

          <span className="type-label text-muted">Mono</span>
          <p className="type-mono">k = 4 shots / 5 seeds / MVTec-AD + VisA</p>

          <span className="type-label text-muted">Label</span>
          <p className="type-label">Vision / 2026 / PyTorch</p>

          <span className="type-label text-muted">Glyph ramp</span>
          <p className="font-mono text-2xl tracking-[0.4em]">.:-+*=%@#&amp;</p>
        </div>
      </section>

      {/* Neutrals */}
      <section className="pt-24">
        <h2 className="type-h2">Neutrals</h2>
        <ul className="mt-10 grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-6">
          {NEUTRALS.map((n) => (
            <li key={n.token} className="bg-bg p-4">
              <div className="border-line h-20 border" style={{ background: n.hex }} />
              <p className="type-label mt-3">{n.token}</p>
              <p className="type-mono text-muted">{n.hex}</p>
              <p className="text-muted mt-1 text-sm">{n.use}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Data check */}
      <section className="pt-24">
        <h2 className="type-h2">Project data, as loaded</h2>
        <p className="text-muted mt-3 max-w-[65ch]">
          Read from the project data file, in site order. This is a data check, not the final row
          design.
        </p>
        <ol className="mt-10">
          {projects.map((p, i) => (
            <li
              key={p.slug}
              className="border-line grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-1 border-t py-5 lg:grid-cols-[2.5rem_18rem_1fr_6rem]"
            >
              <span className="type-mono text-dim">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display text-xl font-bold">{p.name}</span>
              <span className="text-muted col-start-2 lg:col-start-3">{p.oneLine}</span>
              <span className="type-label text-accent col-start-2 lg:col-start-4 lg:text-right">
                {domainLabels[p.domain]}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
