import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus — Papers into Practice",
  description: "Search research papers and turn them into step-by-step implementation notebooks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en">
          <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
