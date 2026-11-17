import { profile } from "@/content/profile";

/*
  Photo slot is empty until a portrait is supplied (PLAN.md, section 12).
  It will be tried as an ASCII render first, then as a duotone photo.
*/
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="pt-28 lg:pt-36">
      <h2 id="about-title" data-field-clear className="type-h1 w-fit">
        About
      </h2>

      <div
        data-field-clear
        className="mt-10 flex max-w-[62ch] flex-col gap-5 text-lg leading-relaxed"
      >
        {profile.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <dl data-field-clear className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="type-label text-dim">Looking for</dt>
          <dd className="mt-2">{profile.openTo.replace(/^Looking for /, "").replace(/\.$/, "")}</dd>
        </div>
        <div>
          <dt className="type-label text-dim">Studying</dt>
          <dd className="mt-2">{profile.education.replace(/\.$/, "")}</dd>
        </div>
        <div>
          <dt className="type-label text-dim">Based in</dt>
          <dd className="mt-2">{profile.location}</dd>
        </div>
      </dl>
    </section>
  );
}
