"use client";

/** Thin fetch wrapper for JSON endpoints: throws a readable Error with the server's message on failure. */
async function post<T>(
  url: string,
  body: BodyInit,
  isJson: boolean,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
    body,
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export function docPayload(input: { text?: string; file?: File }, fieldName = "file") {
  if (input.file) {
    const form = new FormData();
    form.append(fieldName, input.file);
    return { body: form as BodyInit, isJson: false as const };
  }
  return {
    body: JSON.stringify({ text: input.text ?? "" }),
    isJson: true as const,
  };
}

/**
 * Simplify a document. For pasted text, the server streams the response, so
 * this reads it incrementally and calls onChunk as text arrives — the caller
 * sees output well before the full ~2000-token completion finishes, instead
 * of waiting on a single buffered JSON response. File uploads still return a
 * single JSON payload (the server must parse the file before it can call the
 * model at all), delivered via one onChunk call.
 */
export async function simplifyDocument(
  input: { text?: string; file?: File },
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { body, isJson } = docPayload(input);
  const res = await fetch("/api/simplify", {
    method: "POST",
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
    body,
    signal,
  });

  if (!isJson) {
    // File-upload path: single buffered JSON response.
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
    onChunk(data.simplified as string);
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status}).`);
  }
  if (!res.body) {
    onChunk(await res.text());
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function extractClauses(input: { text?: string; file?: File }, signal?: AbortSignal) {
  const { body, isJson } = docPayload(input);
  return post<{
    clauses: {
      title: string;
      quote: string;
      plain_meaning: string;
      category: string;
      severity: "low" | "medium" | "high";
      why_it_matters: string;
    }[];
    overall_risk_summary: string;
  }>("/api/clauses", body, isJson, signal);
}

// Repeating the exact same question against the exact same document is
// common (re-reading an answer, retyping after a typo-fix). Cache by
// document+question so a repeat doesn't re-spend a model call.
const qaCache = new Map<string, string>();

export async function askQuestion(
  text: string,
  question: string,
  signal?: AbortSignal
): Promise<{ answer: string; fromCache: boolean }> {
  const key = `${text.length}:${text.slice(0, 200)}::${question.trim().toLowerCase()}`;
  const cached = qaCache.get(key);
  if (cached) return { answer: cached, fromCache: true };

  const { answer } = await post<{ answer: string }>(
    "/api/qa",
    JSON.stringify({ text, question }),
    true,
    signal
  );
  qaCache.set(key, answer);
  return { answer, fromCache: false };
}

export async function compareDocuments(
  a: { text?: string; file?: File },
  b: { text?: string; file?: File },
  signal?: AbortSignal
) {
  if (a.file && b.file) {
    const form = new FormData();
    form.append("fileA", a.file);
    form.append("fileB", b.file);
    return post<{
      summary: string;
      differences: {
        topic: string;
        document_a: string;
        document_b: string;
        significance: "low" | "medium" | "high";
        note: string;
      }[];
      only_in_a: string[];
      only_in_b: string[];
    }>("/api/compare", form, false, signal);
  }
  return post<{
    summary: string;
    differences: {
      topic: string;
      document_a: string;
      document_b: string;
      significance: "low" | "medium" | "high";
      note: string;
    }[];
    only_in_a: string[];
    only_in_b: string[];
  }>(
    "/api/compare",
    JSON.stringify({ textA: a.text ?? "", textB: b.text ?? "" }),
    true,
    signal
  );
}

export async function generateChecklist(input: { text?: string; file?: File }, signal?: AbortSignal) {
  const { body, isJson } = docPayload(input);
  return post<{
    before_signing: string[];
    key_dates_and_deadlines: { what: string; detail: string }[];
    questions_for_a_lawyer: string[];
    red_flags: string[];
  }>("/api/checklist", body, isJson, signal);
}
