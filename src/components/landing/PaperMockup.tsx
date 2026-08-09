export function PaperMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* soft backdrop card for depth */}
      <div className="absolute -right-4 top-6 h-[420px] w-[300px] rotate-[6deg] rounded-sm bg-[#e4dcc9]" />

      {/* the "paper" card */}
      <div className="relative rotate-[-3deg] rounded-sm border border-black/10 bg-white p-7 shadow-[0_30px_60px_-20px_rgba(23,24,27,0.35)]">
        <div className="flex items-center justify-between font-[family-name:var(--font-mono-label)] text-[10px] uppercase tracking-widest text-stone-400">
          <span>01 — Research Note</span>
          <span>arXiv / 2017</span>
        </div>

        <h3 className="mt-6 font-[family-name:var(--font-display)] text-3xl leading-tight text-ink">
          Attention Is
          <br />
          <em className="text-blue not-italic italic">All You Need</em>
        </h3>

        <p className="mt-3 font-[family-name:var(--font-mono-label)] text-[11px] text-stone-400">
          Vaswani et al. · NeurIPS 2017
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <div className="h-1.5 w-[92%] rounded-full bg-stone-200" />
          <div className="h-1.5 w-[78%] rounded-full bg-stone-200" />
          <div className="h-1.5 w-[85%] rounded-full bg-stone-200" />
          <div className="h-1.5 w-[60%] rounded-full bg-stone-200" />
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-4 font-[family-name:var(--font-mono-label)] text-[10px] uppercase tracking-widest text-stone-400">
          <span>Abstract</span>
          <span>~15 pages</span>
        </div>

        {/* vertical marginalia tab */}
        <div className="absolute -right-6 top-8 flex -rotate-90 items-center gap-1.5 font-[family-name:var(--font-mono-label)] text-[9px] uppercase tracking-[0.2em] text-terracotta">
          <span>Generate</span>
          <span className="text-stone-300">03</span>
        </div>
      </div>

      {/* the generated-notebook overlay card */}
      <div className="absolute -bottom-6 -right-6 w-[230px] rounded-md border-t-2 border-terracotta bg-navy p-4 shadow-2xl">
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono-label)] text-[10px] uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Notebook Ready
        </div>
        <p className="mt-2 font-[family-name:var(--font-mono-label)] text-[12px] text-stone-200">
          model = Transformer(...)
        </p>
      </div>
    </div>
  );
}
