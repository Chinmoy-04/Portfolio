import Link from "next/link";
import { profile } from "@/content/profile";
import { siteConfig } from "@/content/site.config";
import { SoundToggle } from "./SoundToggle";

/*
  Always-visible top bar. "View projects" is clickable from the first painted
  frame and jumps past the hero (PLAN.md, section 7.4).
*/
export function PinnedNav({ variant = "home" }: { variant?: "home" | "work" }) {
  return (
    <header className="nav-bar fixed inset-x-0 top-0 h-[var(--nav-h)]">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-[var(--gutter)]"
      >
        <Link
          href={variant === "home" ? "#top" : "/"}
          className="font-display truncate text-sm font-extrabold tracking-tight uppercase [font-stretch:115%]"
        >
          {profile.name}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {variant === "home" && siteConfig.features.sound && <SoundToggle />}
          {/* Hidden on phones so the name keeps its room; Contact (and the /work header) carry the CV there. */}
          {profile.links.cv && (
            <span className="hidden sm:contents">
              <a href={profile.links.cv} className="btn btn-ghost" download>
                CV
              </a>
            </span>
          )}
          {variant === "home" ? (
            <a href="#projects" className="btn btn-primary">
              View projects
            </a>
          ) : (
            <Link href="/" className="btn btn-ghost">
              Full site
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
