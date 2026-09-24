"use client";

import { useEffect, useRef, useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { simplifyDocument } from "@/lib/api";

export default function Simplify() {
  const [doc, setDoc] = useState<DocValue>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasInput = Boolean(doc.text?.trim() || doc.file);

  // Cancel any in-flight request if the panel unmounts (tab switch) so the
  // browser and the serverless function both stop doing wasted work.
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function run() {
    controllerRef.current?.abort(); // a fresh run supersedes any stale one
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setResult("");
    try {
      await simplifyDocument(
        doc,
        (chunk) => setResult((prev) => (prev ?? "") + chunk),
        controller.signal
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70">
        Turn dense legal wording into plain language, without dropping the terms that matter.
      </p>
      <DocInput label="Document to simplify" value={doc} onChange={setDoc} />
      <button
        type="button"
        onClick={run}
        disabled={!hasInput || loading}
        className="focus-ring bg-accent text-ink text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-40 hover:brightness-95"
      >
        {loading ? "Simplifying…" : "Simplify document"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      {result !== null && (
        <article
          aria-live="polite"
          className="ruled font-doc text-sm leading-7 max-w-none whitespace-pre-wrap bg-white border border-ink/15 rounded-md p-5"
        >
          {result}
          {loading && <span className="inline-block w-2 h-4 bg-ink/40 ml-0.5 align-middle" aria-hidden="true" />}
        </article>
      )}
    </div>
  );
}
