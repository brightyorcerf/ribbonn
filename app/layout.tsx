import type { Metadata } from "next";
import { Fredoka, Quicksand } from "next/font/google";
import "./globals.css";

/* ---------------- Fonts ---------------- */

// Rounded, playful display font
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

// Clean, friendly body / mono font
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-mono", // ✅ MUST match globals.css
  weight: ["400", "500"],
});

/* ---------------- Metadata ---------------- */

export const metadata: Metadata = {
  title: "Ribbon 🎀 – Make Your Ask",
  description: "Create a personalized link to ask your crush out",
};

/* ---------------- Layout ---------------- */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${quicksand.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
