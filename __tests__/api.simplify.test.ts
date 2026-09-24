import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/anthropic", async () => {
  const actual = await vi.importActual<typeof import("@/lib/anthropic")>("@/lib/anthropic");
  return {
    ...actual,
    callClaude: vi.fn(),
    streamClaude: vi.fn(),
  };
});

vi.mock("@/lib/parseDocument", async () => {
  const actual = await vi.importActual<typeof import("@/lib/parseDocument")>(
    "@/lib/parseDocument"
  );
  return {
    ...actual,
    extractTextFromFile: vi.fn(),
  };
});

import { callClaude, streamClaude } from "@/lib/anthropic";
import { extractTextFromFile } from "@/lib/parseDocument";
import { POST } from "@/app/api/simplify/route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/simplify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value);
  }
  return out;
}

describe("POST /api/simplify — pasted text (streamed)", () => {
  beforeEach(() => {
    vi.mocked(streamClaude).mockReset();
  });

  it("returns 400 when text is missing", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when text is only whitespace", async () => {
    const res = await POST(jsonRequest({ text: "   " }));
    expect(res.status).toBe(400);
  });

  it("streams the simplified text back as it's generated", async () => {
    vi.mocked(streamClaude).mockReturnValue(textStream("Plain-language version."));
    const res = await POST(jsonRequest({ text: "Whereas the party of the first part..." }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await readAll(res)).toBe("Plain-language version.");
    expect(streamClaude).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/simplify — file upload (buffered JSON)", () => {
  beforeEach(() => {
    vi.mocked(callClaude).mockReset();
    vi.mocked(extractTextFromFile).mockReset();
  });

  it("returns the simplified text as JSON on success", async () => {
    vi.mocked(extractTextFromFile).mockResolvedValue("extracted contract text");
    vi.mocked(callClaude).mockResolvedValue("Plain-language version of the contract.");

    const form = new FormData();
    form.append("file", new File(["dummy"], "lease.pdf", { type: "application/pdf" }));
    const req = new NextRequest("http://localhost/api/simplify", { method: "POST", body: form });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.simplified).toBe("Plain-language version of the contract.");
  });

  it("maps an AI service failure to a 502 without leaking internals", async () => {
    const { AiServiceError } = await vi.importActual<typeof import("@/lib/anthropic")>(
      "@/lib/anthropic"
    );
    vi.mocked(extractTextFromFile).mockResolvedValue("extracted contract text");
    vi.mocked(callClaude).mockRejectedValue(new AiServiceError("upstream timeout", 502));

    const form = new FormData();
    form.append("file", new File(["dummy"], "lease.pdf", { type: "application/pdf" }));
    const req = new NextRequest("http://localhost/api/simplify", { method: "POST", body: form });

    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
