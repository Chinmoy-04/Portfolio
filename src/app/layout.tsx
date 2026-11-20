import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { Cursor } from "@/components/ui/Cursor";
import { profile } from "@/content/profile";
import { siteConfig } from "@/content/site.config";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${profile.name} | ${profile.roleShort}`,
    template: `%s | ${profile.name}`,
  },
  description: profile.roleLine,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The home page's intro script sets data-intro before hydration.
      suppressHydrationWarning
      data-accent={siteConfig.accent}
      className={`${archivo.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="min-h-[100dvh]">
        {children}
        {siteConfig.features.customCursor && <Cursor />}
      </body>
    </html>
  );
}
