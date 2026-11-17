import type { Metadata } from "next";
import { ProjectList } from "@/components/projects/ProjectList";
import { Footer } from "@/components/sections/Footer";
import { PinnedNav } from "@/components/ui/PinnedNav";
import { SkipLink } from "@/components/ui/SkipLink";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: `${profile.name}: ${profile.roleLine}`,
};

/*
  The plain page for CVs: no canvas, no animation, every project open.
  Prints cleanly to PDF.
*/
export default function WorkPage() {
  return (
    <>
      <SkipLink />
      <PinnedNav variant="work" />
      <main
        id="main"
        className="mx-auto max-w-[1100px] px-[var(--gutter)] pt-[calc(var(--nav-h)+4rem)]"
      >
        <header>
          <h1 className="type-h1">{profile.name}</h1>
          <p className="mt-4 text-lg">{profile.roleLine}</p>
          <p className="text-muted mt-3 max-w-[60ch]">
            {profile.openTo} Based in {profile.location}.
          </p>

          <ul className="type-label mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <a className="link" href={`mailto:${profile.links.email}`}>
                {profile.links.email}
              </a>
            </li>
            <li>
              <a className="link" href={profile.links.github}>
                GitHub
              </a>
            </li>
            <li>
              <a className="link" href={profile.links.linkedin}>
                LinkedIn
              </a>
            </li>
            {profile.links.cv && (
              <li>
                <a className="link" href={profile.links.cv} download>
                  CV
                </a>
              </li>
            )}
          </ul>
        </header>

        <section id="projects" aria-labelledby="projects-title" className="mt-16 pb-20">
          <h2 id="projects-title" className="type-h2 mb-6">
            Projects
          </h2>
          <ProjectList projects={projects} expandAll />
        </section>
      </main>
      <Footer variant="work" />
    </>
  );
}
