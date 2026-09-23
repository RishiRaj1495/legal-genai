"use client";

import { useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { compareDocuments } from "@/lib/api";

const SIGNIFICANCE_STYLES: Record<string, string> = {
  high: "bg-risk/10 text-risk border-risk/30",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  low: "bg-accent/10 text-accent border-accent/30",
};

export default function Compare() {
  const [a, setA] = useState<DocValue>({});
  const [b, setB] = useState<DocValue>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof compareDocuments>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean((a.text?.trim() || a.file) && (b.text?.trim() || b.file));

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await compareDocuments(a, b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">
        Compare two contracts, agreements, or policy versions and see what actually changed.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <DocInput label="Document A" value={a} onChange={setA} />
        <DocInput label="Document B" value={b} onChange={setB} />
      </div>
      <button
        type="button"
        onClick={run}
        disabled={!ready || loading}
        className="focus-ring bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
      >
        {loading ? "Comparing…" : "Compare documents"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite" className="space-y-4">
          <p className="text-sm bg-white/70 border border-ink/10 rounded-lg p-3">{result.summary}</p>
          <ul className="space-y-3">
            {result.differences.map((d, i) => (
              <li
                key={i}
                className={`border rounded-lg p-3 ${
                  SIGNIFICANCE_STYLES[d.significance] ?? SIGNIFICANCE_STYLES.low
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{d.topic}</h3>
                  <span className="text-[10px] uppercase tracking-wide font-medium opacity-80">
                    {d.significance}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="font-medium">A:</span> {d.document_a}
                  </p>
                  <p>
                    <span className="font-medium">B:</span> {d.document_b}
                  </p>
                </div>
                <p className="text-xs mt-1 opacity-80">{d.note}</p>
              </li>
            ))}
          </ul>
          {(result.only_in_a.length > 0 || result.only_in_b.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Only in A</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.only_in_a.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Only in B</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.only_in_b.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
