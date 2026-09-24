import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Lazily construct a single shared Anthropic client per server process.
 * Throws a clear, actionable error if the API key is missing instead of
 * failing deep inside the SDK.
 */
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment (see .env.example)."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const MODEL = "claude-sonnet-4-6";

/** Rough char cap so a single document stays well inside the model's context window. */
export const MAX_DOCUMENT_CHARS = 120_000;

export class AiServiceError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiServiceError";
    this.status = status;
  }
}

/**
 * Streams a Claude completion as plain text chunks. Used for long, plain-text
 * outputs (e.g. Simplify) so the client can render text as it arrives instead
 * of waiting for the full ~2000-token response to buffer on the server first —
 * this cuts perceived latency without any extra token cost.
 */
export function streamClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const { system, prompt, maxTokens = 2000 } = params;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const anthropic = getClient();
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: prompt }],
        });
        stream.on("text", (chunk) => controller.enqueue(encoder.encode(chunk)));
        await stream.finalMessage();
        controller.close();
      } catch (err) {
        controller.error(
          err instanceof Error ? err : new Error("Unknown streaming failure.")
        );
      }
    },
  });
}


/**
 * Calls Claude with a system prompt + single user turn and returns the
 * concatenated text of the response. Centralizes error handling so every
 * API route fails the same, predictable way instead of leaking SDK errors.
 */
export async function callClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const { system, prompt, maxTokens = 2000 } = params;
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new AiServiceError("The model returned an empty response.");
    }
    return text;
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err instanceof Anthropic.APIError) {
      throw new AiServiceError(`AI service error: ${err.message}`, err.status ?? 502);
    }
    throw new AiServiceError(
      err instanceof Error ? err.message : "Unknown AI service failure."
    );
  }
}

/** Extracts the first {...} or [...] JSON value from a model response, tolerating stray prose/fences. */
export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  if (start === -1 || end === -1 || end < start) {
    throw new AiServiceError("Could not parse a structured response from the model.");
  }
  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    throw new AiServiceError("Model returned malformed JSON.");
  }
}
