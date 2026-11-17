export function SkipLink({ href = "#projects" }: { href?: string }) {
  return (
    <a
      href={href}
      className="no-print bg-accent text-on-accent type-label fixed top-2 left-2 z-[var(--z-cursor)] -translate-y-20 px-4 py-3 font-bold focus:translate-y-0"
    >
      Skip to projects
    </a>
  );
}
