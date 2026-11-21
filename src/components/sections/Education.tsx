import { profile } from "@/content/profile";

/*
  Education as a vertical rail, newest first. Each entry hangs off a square
  node like the cells of the site icon: off-white for finished, amber for the
  one in progress.
*/
export function Education() {
  return (
    <div data-field-clear className="mt-16">
      <h3 className="type-label text-accent">Education</h3>

      <ol className="border-line mt-8 ml-[5px] border-l">
        {profile.education.map((e) => {
          const current = e.to === null;
          return (
            <li key={e.degree} className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
              <span
                aria-hidden="true"
                className={`absolute top-[0.2rem] -left-[6px] size-[11px] ${
                  current ? "bg-accent" : "bg-[var(--text)]"
                }`}
              />
              <p className="type-label text-muted">
                {e.from} <span aria-hidden="true">→</span>
                <span className="sr-only">to</span>{" "}
                {current ? <span className="text-accent">Now</span> : e.to}
              </p>
              <h4 className="type-h2 mt-3 max-w-[30ch]">{e.degree}</h4>
              <p className="mt-2">{e.school}</p>
              {e.note && <p className="text-muted mt-1">{e.note}</p>}
              <p className="type-mono text-dim mt-4">{e.focus}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
