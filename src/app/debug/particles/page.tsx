import type { Metadata } from "next";
import { ParticleDebug } from "@/components/debug/ParticleDebug";

export const metadata: Metadata = {
  title: "Particle debug",
  robots: { index: false },
};

export default function ParticleDebugPage() {
  return <ParticleDebug />;
}
