"use client";

import { useCallback, useEffect, useState } from "react";
import { domainLabels, type Project } from "@/content/projects";
import { scrollToElement } from "@/lib/scroll";

type Props = {
  projects: Project[];
  /** /work and print: every row open, no toggling. */
  expandAll?: boolean;
};

/*
  Numbered project rows that expand in place. One row open at a time.
  #p-<slug> in the URL opens that row and scrolls to it, which is where the
  hero chapter links point.
*/
export function ProjectList({ projects, expandAll = false }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  /** Opens the row named in the hash and returns it, or null. */
  const openFromHash = useCallback(() => {
    const match = window.location.hash.match(/^#p-(.+)$/);
    if (!match) return null;
    const slug = decodeURIComponent(match[1]);
    if (!projects.some((p) => p.slug === slug)) return null;
    setOpenSlug(slug);
    return document.getElementById(`p-${slug}`);
  }, [projects]);

  useEffect(() => {
    if (expandAll) return;
    const scrollTo = (row: HTMLElement | null) => {
      if (row) scrollToElement(row);
    };
    // Open the row in the next task rather than the next frame: frames can be
    // held up for seconds while the hero engine starts on a slow device.
    // Scroll once a frame has painted, so the open row has its height.
    let frame = 0;
    const timer = setTimeout(() => {
      const row = openFromHash();
      frame = requestAnimationFrame(() => scrollTo(row));
    });
    const onHashChange = () => scrollTo(openFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [expandAll, openFromHash]);

  const toggle = (slug: string) => {
    const next = openSlug === slug ? null : slug;
    setOpenSlug(next);
    // Keep the URL shareable without triggering a jump.
    const url = next ? `#p-${next}` : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", url);
  };

  return (
    <ol className="border-line border-b">
      {projects.map((project, index) => (
        <ProjectRow
          key={project.slug}
          project={project}
          index={index}
          open={expandAll || openSlug === project.slug}
          toggleable={!expandAll}
          onToggle={() => toggle(project.slug)}
        />
      ))}
    </ol>
  );
}

function ProjectRow({
  project,
  index,
  open,
  toggleable,
  onToggle,
}: {
  project: Project;
  index: number;
  open: boolean;
  toggleable: boolean;
  onToggle: () => void;
}) {
  const panelId = `panel-${project.slug}`;
  const number = String(index + 1).padStart(2, "0");

  const heading = (
    <>
      <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="type-h2 group-hover:text-accent min-w-0 transition-colors duration-200">
          {project.name}
        </span>
        <span className="type-label text-accent">{domainLabels[project.domain]}</span>
        <span className="type-label text-dim">{project.year}</span>
      </span>
      <span className="text-muted mt-2 block max-w-[62ch]">{project.oneLine}</span>
    </>
  );

  return (
    <li id={`p-${project.slug}`} className="project-row border-line border-t">
      <div
        data-field-clear
        className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 py-6 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-x-4 lg:py-7"
      >
        <span className="type-mono text-dim pt-[0.35em]" aria-hidden="true">
          {number}
        </span>

        {/* A heading per row, so screen readers can jump between projects. */}
        <h3>
          {toggleable ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={onToggle}
              className="group w-full text-left"
            >
              {heading}
            </button>
          ) : (
            heading
          )}
        </h3>

        <div className="col-start-2 mt-4 flex items-center gap-5 sm:col-start-3 sm:row-start-1 sm:mt-1 sm:items-start">
          <QuickLinks project={project} />
          {toggleable && (
            <button
              type="button"
              aria-label={`${open ? "Collapse" : "Expand"} ${project.name}`}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={onToggle}
              className="border-line text-muted hover:border-accent hover:text-accent no-print grid size-8 shrink-0 place-items-center border transition-colors"
            >
              <span
                aria-hidden="true"
                className={`font-mono text-lg leading-none transition-transform duration-300 ${
                  open ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
          )}
        </div>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={`${project.name} details`}
        data-open={open}
        inert={!open}
        className="project-panel grid"
      >
        <div className="overflow-hidden">
          <ProjectDetails project={project} />
        </div>
      </div>
    </li>
  );
}

function QuickLinks({ project }: { project: Project }) {
  const { repo, demo } = project.links;
  return (
    <span className="type-label no-print flex gap-4">
      {demo && (
        <a className="link" href={demo} target="_blank" rel="noreferrer">
          Live demo <span aria-hidden="true">&#8599;</span>
        </a>
      )}
      {repo && (
        <a className="link" href={repo} target="_blank" rel="noreferrer">
          Code <span aria-hidden="true">&#8599;</span>
        </a>
      )}
    </span>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  const { repo, demo, paper } = project.links;

  return (
    <div
      data-field-clear
      className="grid grid-cols-[minmax(0,1fr)] gap-8 pb-10 pl-[calc(2.25rem+0.75rem)] sm:pl-[calc(3rem+1rem)] lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12"
    >
      <div>
        <p className="max-w-[62ch]">{project.summary}</p>

        {project.highlights && project.highlights.length > 0 && (
          <ul className="mt-5 flex max-w-[62ch] flex-col gap-2">
            {project.highlights.map((h) => (
              <li key={h} className="text-muted grid grid-cols-[1rem_1fr]">
                <span aria-hidden="true" className="text-accent font-mono">
                  &gt;
                </span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          {demo && (
            <a className="btn btn-primary" href={demo} target="_blank" rel="noreferrer">
              Live demo
            </a>
          )}
          {repo && (
            <a className="btn btn-ghost" href={repo} target="_blank" rel="noreferrer">
              Code
            </a>
          )}
          {paper && (
            <a className="btn btn-ghost" href={paper} target="_blank" rel="noreferrer">
              Paper
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {project.metrics && project.metrics.length > 0 && (
          <dl className="grid grid-cols-2 gap-4">
            {project.metrics.map((m) => (
              <div key={m.label}>
                <dt className="type-label text-dim">{m.label}</dt>
                <dd className="text-accent mt-1 font-mono text-xl">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div>
          <p className="type-label text-dim">Built with</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <li key={item} className="type-label border-line text-muted border px-2 py-1">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {project.role && (
          <div>
            <p className="type-label text-dim">Role</p>
            <p className="text-muted mt-2 text-sm">{project.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}
