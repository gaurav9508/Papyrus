import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CornerDownRight,
  Play,
} from "lucide-react";
import { PaperMockup } from "@/components/landing/PaperMockup";
import Image from "next/image";

const NAV_LINKS = [
  { href: "#workflow", label: "How it works" },
  { href: "#principles", label: "Principles" },
];

const PROCESS_STEPS = [
  "Paper in",
  "Method explained",
  "Code you can run",
  "Saved for later",
];

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Bring the paper",
    description:
      "Upload a PDF, or search by topic to pull it straight from arXiv or Semantic Scholar.",
  },
  {
    number: "02",
    title: "Build the method",
    description:
      "Get an editable notebook with the intuition, a runnable implementation, and the steps in between.",
  },
  {
    number: "03",
    title: "Revisit anytime",
    description:
      "Every generation is saved as a session — reopen it, rerun it, or download it whenever you need it again.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="bg-cream text-ink">
      {/* NAV */}
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue text-blue">
              <BookOpen size={14} />
            </span>
            <span className="font-(family-name:--font-mono-label) text-m font-medium tracking-tight">
              papyrus
            </span>
          </Link>

          <nav className="hidden items-center gap-8 font-(family-name:--font-mono-label) text-[13px] text-stone-500 sm:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </a>
            ))}
          </nav>

          <Link
            href="/sign-in"
            className="flex items-center gap-1 font-(family-name:--font-mono-label) text-[13px] text-ink"
          >
            Sign in <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-(family-name:--font-mono-label) text-[12px] uppercase tracking-widest text-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-blue" />
              Research, made executable
            </div>

            <h1 className="mt-5 font-(family-name:--font-display) text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Turn papers into <em className="text-blue italic">working</em>{" "}
              ideas.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">
              Papyrus reads the dense parts, builds the notebook, and saves it
              beside you for whenever the questions get interesting again.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <Link
                href="/sign-up"
                className="flex items-center gap-2 rounded-md bg-blue px-5 py-3 font-(family-name:--font-mono-label) text-[13px] text-white transition-opacity hover:opacity-90"
              >
                Open your workspace <ArrowUpRight size={14} />
              </Link>
              <a
                href="#workflow"
                className="flex items-center gap-2 font-(family-name:--font-mono-label) text-[13px] text-ink"
              >
                <Play size={12} className="fill-ink" /> See the flow
              </a>
            </div>

            <div className="mt-10 flex items-center gap-2 text-sm text-stone-500">
              <CornerDownRight size={14} className="text-terracotta" />
              From paper to first notebook in one sitting.
            </div>
          </div>

          <PaperMockup />
        </div>

        {/* PROCESS STRIP */}
        <div className="mt-20 grid grid-cols-2 gap-y-6 border-t border-black/10 pt-8 font-(family-name:--font-mono-label) text-[13px] sm:flex sm:items-center sm:justify-between">
          {PROCESS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="text-blue">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-stone-500">{step}</span>
              {i < PROCESS_STEPS.length - 1 && (
                <ArrowRight
                  size={13}
                  className="ml-3 hidden text-terracotta sm:block"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="border-t border-black/10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-(family-name:--font-mono-label) text-[12px] uppercase tracking-widest text-blue">
            The Workflow
          </p>
          <h2 className="mt-4 max-w-2xl font-(family-name:--font-display) text-4xl leading-tight tracking-tight sm:text-5xl">
            A better way to <em className="text-blue italic">begin</em> with a
            paper.
          </h2>
          <p className="mt-5 max-w-md text-stone-600">
            No more bouncing between a PDF, scattered notes, and a half-finished
            notebook.
          </p>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.number}>
                <span className="font-(family-name:--font-mono-label) text-sm text-terracotta">
                  {step.number}
                </span>
                <h3 className="mt-3 font-(family-name:--font-display) text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-stone-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVENANCE */}
      <section
        id="principles"
        className="grid border-t border-black/10 lg:grid-cols-2"
      >
        <div className="relative min-h-105">
          <Image
            src="/images/journal.png"
            alt="Open journal with handwritten notes, a pen, and paperclips on a wooden desk"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col justify-center bg-navy px-10 py-20 text-cream sm:px-16">
          <p className="font-(family-name:--font-mono-label) text-[12px] uppercase tracking-widest text-gold">
            A Note on Provenance
          </p>
          <h2 className="mt-5 max-w-md font-(family-name:--font-display) text-4xl leading-tight tracking-tight">
            Useful is not the same as{" "}
            <em className="text-gold italic">mysterious.</em>
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-stone-300">
            Papyrus keeps the source visible — every notebook links back to the
            paper it came from. Code stays editable. You decide what makes it
            into your experiment.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 flex w-fit items-center gap-2 border-b border-cream/40 pb-1 font-(family-name:--font-mono-label) text-[13px] text-cream hover:border-cream"
          >
            Explore the workspace <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue text-blue">
              <BookOpen size={12} />
            </span>
            <span className="font-(family-name:--font-mono-label) text-sm">
              papyrus
            </span>
          </span>

          <p className="font-(family-name:--font-mono-label) text-[12px] text-stone-500">
            For the curious, the careful, and the almost-convinced.
          </p>

          <Link
            href="/sign-up"
            className="flex items-center gap-1 font-(family-name:--font-mono-label) text-[13px] text-blue"
          >
            Enter workspace <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
