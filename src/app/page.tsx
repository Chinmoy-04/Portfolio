import { Hero } from "@/components/hero/Hero";
import { introScript } from "@/components/hero/intro";
import { FieldRegion } from "@/components/motion/FieldRegion";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
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
      {/* Picks the opening before first paint (?intro=counter|name|none). */}
      <script dangerouslySetInnerHTML={{ __html: introScript }} />
      <SmoothScroll />
      <SkipLink />
      <PinnedNav />
      <main id="main">
        <Hero />

        <FieldRegion className="mx-auto grid max-w-[1400px] gap-16 px-[var(--gutter)] pt-16 pb-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:pt-24">
          <IdentityColumn />

          <div>
            <section id="projects" aria-labelledby="projects-title">
              <div data-field-clear className="mb-10">
                <h2 id="projects-title" className="type-h1">
                  Projects
                </h2>
                <p className="text-muted mt-4 max-w-[52ch]">
                  Select a project for the write-up, stack and links.
                </p>
              </div>
              <ProjectList projects={projects} />
            </section>

            <About />
            <Stack />
          </div>
        </FieldRegion>

        <Contact />
      </main>
      <Footer />
    </>
  );
}
