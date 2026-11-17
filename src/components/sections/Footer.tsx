import Link from "next/link";
import { profile } from "@/content/profile";

export function Footer({ variant = "home" }: { variant?: "home" | "work" }) {
  return (
    <footer className="border-line mx-auto flex max-w-[1400px] flex-col gap-3 border-t px-[var(--gutter)] py-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="type-label text-dim">&copy; 2026 {profile.name}</p>
      <p className="type-label no-print">
        {variant === "home" ? (
          <Link className="link text-dim" href="/work">
            Plain version of this page
          </Link>
        ) : (
          <Link className="link text-dim" href="/">
            Full site
          </Link>
        )}
      </p>
    </footer>
  );
}
