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
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold">Legal Clarity AI</h1>
        <p className="text-ink/70 mt-1">
          Understand, compare, and navigate legal documents — in plain language.
        </p>
      </header>

      <div
        role="note"
        aria-label="Legal disclaimer"
        className="mb-6 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"
      >
        <strong>Not legal advice.</strong> This tool explains and organizes information
        to help you understand documents and prepare for a conversation with a licensed
        professional. It does not replace one.
      </div>

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`}>
        {active === "simplify" && <Simplify />}
        {active === "clauses" && <Clauses />}
        {active === "qa" && <QA />}
        {active === "compare" && <Compare />}
        {active === "checklist" && <Checklist />}
      </div>

      <footer className="mt-12 text-xs text-ink/40 text-center">
        -Rishi
      </footer>
    </main>
  );
}
