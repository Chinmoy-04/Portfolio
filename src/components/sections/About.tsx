import Image from "next/image";
import { profile } from "@/content/profile";
import { Education } from "./Education";

/*
  The portrait (a duotone cut-out made by scripts/portrait.py, chosen
  21 Nov 2026) sits beside the text from lg up and above it on phones.
*/
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="pt-28 lg:pt-36">
      <h2 id="about-title" data-field-clear className="type-h1 w-fit">
        About
      </h2>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row-reverse lg:items-start lg:justify-end">
        <div data-field-clear className="w-[min(70%,300px)] shrink-0 lg:w-[260px] xl:w-[300px]">
          <Image
            src="/portrait-duotone.png"
            alt={`Portrait of ${profile.name}`}
            width={800}
            height={800}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 260px, 70vw"
            className="h-auto w-full"
          />
        </div>
        <div data-field-clear className="flex max-w-[62ch] flex-col gap-5 text-lg leading-relaxed">
          {profile.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>

      <dl data-field-clear className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="type-label text-dim">Looking for</dt>
          <dd className="mt-2">{profile.openTo.replace(/^Looking for /, "").replace(/\.$/, "")}</dd>
        </div>
        <div>
          <dt className="type-label text-dim">Based in</dt>
          <dd className="mt-2">{profile.location}</dd>
        </div>
      </dl>

      <Education />
    </section>
  );
}
