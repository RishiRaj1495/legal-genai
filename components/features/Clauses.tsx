"use client";

import { useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { extractClauses } from "@/lib/api";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-risk/10 text-risk border-risk/30",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-accent/10 text-accent border-accent/30",
};

export default function Clauses() {
  const [doc, setDoc] = useState<DocValue>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof extractClauses>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInput = Boolean(doc.text?.trim() || doc.file);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await extractClauses(doc));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">
        Surfaces obligations, deadlines, money terms, and risk clauses worth a second look.
      </p>
      <DocInput label="Document to scan" value={doc} onChange={setDoc} />
      <button
        type="button"
        onClick={run}
        disabled={!hasInput || loading}
        className="focus-ring bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
      >
        {loading ? "Scanning…" : "Highlight clauses & risks"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite" className="space-y-4">
          <p className="text-sm bg-white/70 border border-ink/10 rounded-lg p-3">
            {result.overall_risk_summary}
          </p>
          <ul className="space-y-3">
            {result.clauses.map((c, i) => (
              <li
                key={i}
                className={`border rounded-lg p-3 ${SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.low}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <span className="text-[10px] uppercase tracking-wide font-medium opacity-80">
                    {c.severity} · {c.category}
                  </span>
                </div>
                <blockquote className="text-xs italic opacity-80 mb-1">“{c.quote}”</blockquote>
                <p className="text-sm">{c.plain_meaning}</p>
                <p className="text-xs mt-1 opacity-80">Why it matters: {c.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
