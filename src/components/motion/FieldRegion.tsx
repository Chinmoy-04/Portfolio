"use client";

import { useRef } from "react";
import { QuietField } from "./QuietField";

/* A page region with the quiet ASCII field behind its content. */
export function FieldRegion({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="relative isolate">
      <QuietField regionRef={ref} />
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
}
