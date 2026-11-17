"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "contact", label: "Contact" },
] as const;

/* Section links that mark the section currently in view. */
export function SectionNav() {
  const [active, setActive] = useState<string>("projects");

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      // A thin band a third of the way down the viewport decides the active section.
      { rootMargin: "-33% 0px -66% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Sections" className="mt-14">
      <ul className="flex flex-col gap-3">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`type-label group flex items-center gap-4 transition-colors ${
                  isActive ? "text-text" : "text-dim hover:text-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-px transition-[width,background-color] duration-300 ${
                    isActive ? "bg-accent w-16" : "bg-dim w-8 group-hover:w-12"
                  }`}
                />
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
