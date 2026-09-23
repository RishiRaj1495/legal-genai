"use client";

import { useState } from "react";
import DocInput, { DocValue } from "../DocInput";
import { askQuestion } from "@/lib/api";

interface Turn {
  question: string;
  answer: string;
}

export default function QA() {
  const [doc, setDoc] = useState<DocValue>({});
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDoc = Boolean(doc.text?.trim());

  async function ask() {
    if (!question.trim() || !doc.text) return;
    setLoading(true);
    setError(null);
    try {
      const { answer } = await askQuestion(doc.text, question.trim());
      setTurns((t) => [...t, { question: question.trim(), answer }]);
      setQuestion("");
    } catch (e) {
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
          className="focus-ring flex-1 rounded-md border border-ink/20 p-2 text-sm bg-white/70"
        />
        <button
          type="button"
          onClick={ask}
          disabled={!hasDoc || !question.trim() || loading}
          className="focus-ring bg-accent text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40"
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
          <li key={i} className="bg-white/70 border border-ink/10 rounded-lg p-3">
            <p className="text-sm font-semibold">Q: {t.question}</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{t.answer}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
