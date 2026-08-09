import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-label",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Papyrus — Papers into Practice",
  description:
    "Search research papers and turn them into step-by-step implementation notebooks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <ConvexClientProvider>
        <html
          lang="en"
          className={`${fraunces.variable} ${jetbrainsMono.variable} ${inter.variable}`}
        >
          <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
            {children}
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
