import { profile } from "@/content/profile";

export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="scroll-mt-28 pt-28 lg:pt-36">
      <h2 id="stack-title" className="type-h1">
        Stack
      </h2>

      <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2">
        {profile.stack.map((group) => (
          <div
            key={group.group}
            className="bg-bg py-6 sm:p-6 sm:first:pl-0 sm:[&:nth-child(3)]:pl-0"
          >
            <h3 className="type-label text-accent">{group.group}</h3>
            <ul className="type-mono mt-4 flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
