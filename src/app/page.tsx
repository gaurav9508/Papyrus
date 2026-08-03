import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-2 text-stone-900">
        <BookOpen size={28} />
        <span className="text-2xl font-semibold">Papyrus</span>
      </div>
      <h1 className="max-w-xl text-3xl font-bold text-stone-900 sm:text-4xl">
        Turn research papers into step-by-step implementation notebooks
      </h1>
      <p className="max-w-lg text-stone-600">
        Search for papers on any topic, or upload one directly, and get a
        guided walkthrough with runnable code — saved so you can revisit it anytime.
      </p>
      <div className="flex gap-3">
        <Link href="/sign-up">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/sign-in">
          <Button size="lg" variant="secondary">
            Sign In
          </Button>
        </Link>
      </div>
    </main>
  );
}
