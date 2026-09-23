import { describe, it, expect } from "vitest";
import { extractJson, AiServiceError } from "../lib/anthropic";
import { requireNonEmptyString, ValidationError } from "../lib/prompts";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    const result = extractJson<{ a: number }>('{"a": 1}');
    expect(result.a).toBe(1);
  });

  it("parses JSON wrapped in a markdown fence", () => {
    const result = extractJson<{ a: number }>('Here you go:\n```json\n{"a": 2}\n```');
    expect(result.a).toBe(2);
  });

  it("parses JSON with leading/trailing prose", () => {
    const result = extractJson<{ ok: boolean }>('Sure! {"ok": true} Let me know if you need more.');
    expect(result.ok).toBe(true);
  });

  it("throws AiServiceError on unparsable input", () => {
    expect(() => extractJson("not json at all")).toThrow(AiServiceError);
  });

  it("throws AiServiceError on malformed JSON", () => {
    expect(() => extractJson("{a: 1,}")).toThrow(AiServiceError);
  });
});

describe("requireNonEmptyString", () => {
  it("trims and returns valid input", () => {
    expect(requireNonEmptyString("  hello  ", "field")).toBe("hello");
  });

  it("rejects empty strings", () => {
    expect(() => requireNonEmptyString("   ", "field")).toThrow(ValidationError);
  });

  it("rejects non-string input", () => {
    expect(() => requireNonEmptyString(42, "field")).toThrow(ValidationError);
  });

  it("rejects input over the max length", () => {
    expect(() => requireNonEmptyString("x".repeat(10), "field", 5)).toThrow(ValidationError);
  });
});
