import type { Metadata } from "next";
import { Fredoka, Quicksand } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-mono", // ✅ MUST match globals.css
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ribbon, Make Your Ask",
  description: "Create a personalized link to ask your crush out",

  openGraph: {
    title: "Ribbon, Make Your Ask 💌",
    description: "Create a personalized link to ask your crush out",
    url: "http://ribbonn.vercel.app",
    siteName: "Ribbon",
    images: [
      {
        url: "http://ribbonn.vercel.app/og.jpg",
        width: 1200,
        height: 630,
        alt: "Ribbon, Make Your Ask",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ribbon, Make Your Ask 💌",
    description: "Create a personalized link to ask your crush out",
    images: ["http://ribbonn.vercel.app/og.jpg"],
  },
};

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
