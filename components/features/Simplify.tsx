"use client";

import { useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { simplifyDocument } from "@/lib/api";

export default function Simplify() {
  const [doc, setDoc] = useState<DocValue>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInput = Boolean(doc.text?.trim() || doc.file);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { simplified } = await simplifyDocument(doc);
      setResult(simplified);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
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
        className="focus-ring bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
      >
        {loading ? "Simplifying…" : "Simplify document"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      {result && (
        <article
          aria-live="polite"
          className="prose prose-sm max-w-none whitespace-pre-wrap bg-white/70 border border-ink/10 rounded-lg p-4"
        >
          {result}
        </article>
      )}
    </div>
  );
}
