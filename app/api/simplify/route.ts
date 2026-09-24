import { NextRequest, NextResponse } from "next/server";
import { callClaude, streamClaude, AiServiceError } from "@/lib/anthropic";
import { extractTextFromFile, DocumentParseError } from "@/lib/parseDocument";
import { SIMPLIFY_SYSTEM, requireNonEmptyString, ValidationError } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // File uploads must be fully parsed before we know what to send the
      // model, so this path returns a single JSON response as before.
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ValidationError('Expected a "file" field in the form data.');
      }
      const text = await extractTextFromFile(file);
      const result = await callClaude({
        system: SIMPLIFY_SYSTEM,
        prompt: `Document:\n"""\n${text}\n"""`,
        maxTokens: 2500,
      });
      return NextResponse.json({ simplified: result });
    }

    const body = await req.json();
    const text = requireNonEmptyString(body.text, "text");

    // Pasted-text path streams: the client sees text as it's generated
    // instead of waiting for the full response to buffer server-side.
    const stream = streamClaude({
      system: SIMPLIFY_SYSTEM,
      prompt: `Document:\n"""\n${text}\n"""`,
      maxTokens: 2500,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
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
  console.error("Unhandled /api/simplify error:", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
