"use client";

/** Thin fetch wrapper: throws a readable Error with the server's message on failure. */
async function post<T>(url: string, body: BodyInit, isJson: boolean): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
    body,
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

export async function simplifyDocument(input: { text?: string; file?: File }) {
  const { body, isJson } = docPayload(input);
  return post<{ simplified: string }>("/api/simplify", body, isJson);
}

export async function extractClauses(input: { text?: string; file?: File }) {
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
  }>("/api/clauses", body, isJson);
}

export async function askQuestion(text: string, question: string) {
  return post<{ answer: string }>(
    "/api/qa",
    JSON.stringify({ text, question }),
    true
  );
}

export async function compareDocuments(
  a: { text?: string; file?: File },
  b: { text?: string; file?: File }
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
    }>("/api/compare", form, false);
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
    true
  );
}

export async function generateChecklist(input: { text?: string; file?: File }) {
  const { body, isJson } = docPayload(input);
  return post<{
    before_signing: string[];
    key_dates_and_deadlines: { what: string; detail: string }[];
    questions_for_a_lawyer: string[];
    red_flags: string[];
  }>("/api/checklist", body, isJson);
}
