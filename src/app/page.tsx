import { StaticHero } from "@/components/hero/StaticHero";
import { ProjectList } from "@/components/projects/ProjectList";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { IdentityColumn } from "@/components/sections/IdentityColumn";
import { Stack } from "@/components/sections/Stack";
import { PinnedNav } from "@/components/ui/PinnedNav";
import { SkipLink } from "@/components/ui/SkipLink";
import { projects } from "@/content/projects";

export default function HomePage() {
  return (
    <>
      <SkipLink />
      <PinnedNav />
      <main id="main">
        <StaticHero />

        <div className="mx-auto grid max-w-[1400px] gap-16 px-[var(--gutter)] pt-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:pt-24">
          <IdentityColumn />

          <div>
            <section id="projects" aria-labelledby="projects-title" className="scroll-mt-28">
              <h2 id="projects-title" className="type-h1">
                Projects
              </h2>
              <p className="text-muted mt-4 mb-10 max-w-[52ch]">
                Select a project for the write-up, stack and links.
              </p>
              <ProjectList projects={projects} />
            </section>

            <About />
            <Stack />
          </div>
        </div>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
