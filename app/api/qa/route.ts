import { NextRequest, NextResponse } from "next/server";
import { callClaude, AiServiceError } from "@/lib/anthropic";
import { QA_SYSTEM, requireNonEmptyString, ValidationError } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = requireNonEmptyString(body.text, "text");
    const question = requireNonEmptyString(body.question, "question", 1000);

    const answer = await callClaude({
      system: QA_SYSTEM,
      prompt: `Document:\n"""\n${text}\n"""\n\nQuestion: ${question}`,
      maxTokens: 800,
    });

    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof AiServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Unhandled /api/qa error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
