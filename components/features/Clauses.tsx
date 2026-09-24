"use client";

import { useEffect, useRef, useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { extractClauses } from "@/lib/api";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-risk/10 text-risk border-risk/30",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-stamp/10 text-stamp border-stamp/30",
};

export default function Clauses() {
  const [doc, setDoc] = useState<DocValue>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof extractClauses>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasInput = Boolean(doc.text?.trim() || doc.file);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function run() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await extractClauses(doc, controller.signal));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
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
        className="focus-ring bg-accent text-ink text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-40 hover:brightness-95"
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
          <p className="text-sm bg-white border border-ink/15 rounded-md p-3">
            {result.overall_risk_summary}
          </p>
          <ul className="space-y-3">
            {result.clauses.map((c, i) => (
              <li
                key={i}
                className={`border rounded-lg p-3 ${SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.low}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[11px] font-medium opacity-80 border border-current/30 rounded px-1.5 py-0.5">
                      {c.severity} risk
                    </span>
                    <span className="text-[11px] font-medium opacity-80 border border-current/30 rounded px-1.5 py-0.5">
                      {c.category}
                    </span>
                  </div>
                </div>
                <blockquote className="font-doc text-xs opacity-80 mb-2 border-l-2 border-current/30 pl-2">
                  {c.quote}
                </blockquote>
                <p className="text-sm">{c.plain_meaning}</p>
                <p className="text-xs mt-1.5 opacity-80">{c.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
