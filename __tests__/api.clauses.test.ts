import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/anthropic", async () => {
  const actual = await vi.importActual<typeof import("@/lib/anthropic")>("@/lib/anthropic");
  return {
    ...actual,
    callClaude: vi.fn(),
  };
});

import { callClaude } from "@/lib/anthropic";
import { POST } from "@/app/api/clauses/route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/clauses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/clauses", () => {
  beforeEach(() => {
    vi.mocked(callClaude).mockReset();
  });

  it("parses a well-formed JSON model response into structured clauses", async () => {
    vi.mocked(callClaude).mockResolvedValue(
      JSON.stringify({
        clauses: [
          {
            title: "Auto-renewal",
            quote: "This agreement renews automatically",
            plain_meaning: "It renews unless you cancel in time.",
            category: "risk",
            severity: "high",
            why_it_matters: "You could be locked in for another term.",
          },
        ],
        overall_risk_summary: "One key risk to review before signing.",
      })
    );
    const res = await POST(jsonRequest({ text: "This agreement renews automatically each year." }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.clauses).toHaveLength(1);
    expect(data.clauses[0].severity).toBe("high");
  });

  it("returns 502 when the model response isn't valid JSON", async () => {
    vi.mocked(callClaude).mockResolvedValue("Sorry, I can't do that.");
    const res = await POST(jsonRequest({ text: "some document text" }));
    expect(res.status).toBe(502);
  });

  it("returns 400 when the request body has neither text nor a file", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });
});
