"use client";

import { useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { generateChecklist } from "@/lib/api";

export default function Checklist() {
  const [doc, setDoc] = useState<DocValue>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateChecklist>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInput = Boolean(doc.text?.trim() || doc.file);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await generateChecklist(doc));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">
        Generates a concrete action checklist and a starter list of questions to bring to a lawyer.
      </p>
      <DocInput label="Document to review" value={doc} onChange={setDoc} />
      <button
        type="button"
        onClick={run}
        disabled={!hasInput || loading}
        className="focus-ring bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
      >
        {loading ? "Building checklist…" : "Generate checklist"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite" className="grid sm:grid-cols-2 gap-4">
          <Section title="Before signing" items={result.before_signing} />
          <Section
            title="Key dates & deadlines"
            items={result.key_dates_and_deadlines.map((d) => `${d.what}: ${d.detail}`)}
          />
          <Section title="Questions for a lawyer" items={result.questions_for_a_lawyer} />
          <Section title="Red flags to double-check" items={result.red_flags} tone="risk" />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "risk";
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={`border rounded-lg p-3 ${
        tone === "risk" ? "bg-risk/10 border-risk/30" : "bg-white/70 border-ink/10"
      }`}
    >
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
