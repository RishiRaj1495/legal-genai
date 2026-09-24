"use client";

import { useEffect, useRef, useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { askQuestion } from "@/lib/api";

interface Turn {
  question: string;
  answer: string;
  fromCache: boolean;
}

export default function QA() {
  const [doc, setDoc] = useState<DocValue>({});
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const hasDoc = Boolean(doc.text?.trim());

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function ask() {
    if (!question.trim() || !doc.text) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const { answer, fromCache } = await askQuestion(doc.text, question.trim(), controller.signal);
      setTurns((t) => [...t, { question: question.trim(), answer, fromCache }]);
      setQuestion("");
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
        Ask questions grounded only in the document you provide — paste the text below
        (file upload isn&apos;t used here since answers need to stay tied to your exact wording).
      </p>
      <DocInput label="Document to ask about" value={doc} onChange={setDoc} />
      {!hasDoc && doc.file && (
        <p className="text-xs text-ink/50">
          Switch to &quot;Paste text&quot; above — Q&amp;A needs the raw text so answers can quote it exactly.
        </p>
      )}
      <div className="flex gap-2">
        <label htmlFor="qa-question" className="sr-only">
          Your question
        </label>
        <input
          id="qa-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="e.g. Can I cancel before the term ends?"
          className="focus-ring flex-1 rounded-md border border-ink/20 p-2 text-sm bg-white"
        />
        <button
          type="button"
          onClick={ask}
          disabled={!hasDoc || !question.trim() || loading}
          className="focus-ring bg-accent text-ink text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-40 hover:brightness-95"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-risk">
          {error}
        </p>
      )}
      <ul className="space-y-3" aria-live="polite">
        {turns.map((t, i) => (
          <li key={i} className="bg-white border border-ink/15 rounded-md p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t.question}</p>
              {t.fromCache && (
                <span className="shrink-0 text-[11px] text-stamp border border-stamp/30 rounded px-1.5 py-0.5">
                  answered earlier
                </span>
              )}
            </div>
            <p className="font-doc text-sm mt-2 leading-7 whitespace-pre-wrap text-ink/90">
              {t.answer}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
