import mammoth from "mammoth";
import { MAX_DOCUMENT_CHARS } from "./anthropic";

export class DocumentParseError extends Error {}

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

/**
 * Extracts plain text from an uploaded File (PDF, DOCX, or TXT).
 * Runs server-side only (uses Node buffers / pdf-parse).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size === 0) {
    throw new DocumentParseError("The uploaded file is empty.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new DocumentParseError("File is too large. Please upload something under 15MB.");
  }
  if (!ACCEPTED_TYPES.has(file.type) && !isKnownExtension(file.name)) {
    throw new DocumentParseError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text: string;
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    text = await extractPdf(buffer);
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = buffer.toString("utf-8");
  }

  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) {
    throw new DocumentParseError(
      "No readable text was found in this file. Scanned/image-only PDFs aren't supported yet."
    );
  }
  return cleaned.slice(0, MAX_DOCUMENT_CHARS);
}

function isKnownExtension(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(".pdf") || n.endsWith(".docx") || n.endsWith(".txt");
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // Dynamic import avoids pdf-parse's debug-mode file read on cold start in some runtimes.
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}
