import { NextRequest, NextResponse } from "next/server";
import { callClaude, extractJson, AiServiceError } from "@/lib/anthropic";
import { extractTextFromFile, DocumentParseError } from "@/lib/parseDocument";
import { COMPARE_SYSTEM, requireNonEmptyString, ValidationError } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export interface Difference {
  topic: string;
  document_a: string;
  document_b: string;
  significance: "low" | "medium" | "high";
  note: string;
}

interface CompareResponse {
  summary: string;
  differences: Difference[];
  only_in_a: string[];
  only_in_b: string[];
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let textA: string;
    let textB: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const fileA = form.get("fileA");
      const fileB = form.get("fileB");
      if (!(fileA instanceof File) || !(fileB instanceof File)) {
        throw new ValidationError('Expected "fileA" and "fileB" in the form data.');
      }
      [textA, textB] = await Promise.all([
        extractTextFromFile(fileA),
        extractTextFromFile(fileB),
      ]);
    } else {
      const body = await req.json();
      textA = requireNonEmptyString(body.textA, "textA");
      textB = requireNonEmptyString(body.textB, "textB");
    }

    const raw = await callClaude({
      system: COMPARE_SYSTEM,
      prompt: `Document A:\n"""\n${textA}\n"""\n\nDocument B:\n"""\n${textB}\n"""`,
      maxTokens: 3000,
    });

    const parsed = extractJson<CompareResponse>(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof ValidationError || err instanceof DocumentParseError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof AiServiceError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Unhandled /api/compare error:", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
