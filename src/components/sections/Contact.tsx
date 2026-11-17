import { profile } from "@/content/profile";

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="border-line mx-auto mt-32 max-w-[1400px] border-t px-[var(--gutter)] pt-16 pb-20 lg:mt-44 lg:pt-24"
    >
      <h2 id="contact-title" className="type-h1">
        Contact
      </h2>
      <p className="text-muted mt-4 max-w-[52ch]">{profile.openTo}</p>

      <a
        href={`mailto:${profile.links.email}`}
        className="font-display hover:text-accent mt-10 inline-block text-[clamp(1.4rem,0.6rem+3.6vw,3.75rem)] leading-tight font-extrabold tracking-tight break-all [font-stretch:110%] transition-colors"
      >
        {profile.links.email}
      </a>

      <ul className="type-label mt-10 flex flex-wrap gap-x-8 gap-y-3">
        <li>
          <a className="link" href={profile.links.github} target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">&#8599;</span>
          </a>
        </li>
        <li>
          <a className="link" href={profile.links.linkedin} target="_blank" rel="noreferrer">
            LinkedIn <span aria-hidden="true">&#8599;</span>
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
    </section>
  );
}
