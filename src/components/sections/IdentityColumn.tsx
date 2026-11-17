import { profile } from "@/content/profile";
import { SectionNav } from "./SectionNav";

/*
  Sticky left column on desktop (the Brittany Chiang pattern). Hidden on
  small screens, where the hero already carries the name and role.
*/
export function IdentityColumn() {
  return (
    <aside
      data-field-clear
      className="hidden lg:sticky lg:top-[calc(var(--nav-h)+4rem)] lg:block lg:h-fit"
    >
      <p className="font-display text-3xl leading-none font-extrabold tracking-tight [font-stretch:115%]">
        {profile.name}
      </p>
      <p className="text-muted mt-4 max-w-[30ch]">{profile.roleLine}</p>
      <p className="mt-6 max-w-[34ch] text-sm">
        <span className="text-accent">Open to work.</span>{" "}
        <span className="text-muted">{profile.openTo}</span>
      </p>

      <SectionNav />

      <ul className="type-label mt-12 flex gap-5">
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
        <li>
          <a className="link" href={`mailto:${profile.links.email}`}>
            Email
          </a>
        </li>
      </ul>
    </aside>
  );
}
