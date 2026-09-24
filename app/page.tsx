"use client";

import { useState } from "react";
import Tabs, { TabDef } from "@/components/Tabs";
import Simplify from "@/components/features/Simplify";
import Clauses from "@/components/features/Clauses";
import QA from "@/components/features/QA";
import Compare from "@/components/features/Compare";
import Checklist from "@/components/features/Checklist";

const TABS: TabDef[] = [
  { id: "simplify", label: "Simplify" },
  { id: "clauses", label: "Clauses & Risks" },
  { id: "qa", label: "Ask a Question" },
  { id: "compare", label: "Compare" },
  { id: "checklist", label: "Checklist" },
];

export default function Home() {
  const [active, setActive] = useState("simplify");

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs tracking-wide text-ink/50 mb-1">Plain-language document review</p>
          <h1 className="font-display text-4xl sm:text-[2.75rem] leading-none">Legal Clarity</h1>
        </div>
        <div
          aria-label="Legal disclaimer"
          className="shrink-0 self-start sm:self-auto border-2 border-risk/70 text-risk text-[11px] font-medium px-3 py-2 rounded -rotate-1 leading-snug max-w-[220px]"
        >
          Not legal advice. Information to help you understand a document and prepare
          for a professional — not a substitute for one.
        </div>
      </header>

      <section aria-label="Legal Clarity tools">
        <Tabs tabs={TABS} active={active} onChange={setActive} />
        <div
          id={`panel-${active}`}
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          className="border border-ink/20 rounded-b-md rounded-tr-md bg-paper p-5 sm:p-6"
        >
          {active === "simplify" && <Simplify />}
          {active === "clauses" && <Clauses />}
          {active === "qa" && <QA />}
          {active === "compare" && <Compare />}
          {active === "checklist" && <Checklist />}
        </div>
      </section>

      <footer className="mt-10 text-xs text-ink/45 text-center">
        Documents are processed per-request and never stored.
      </footer>
    </main>
  );
}
