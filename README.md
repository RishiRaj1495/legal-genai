# Legal Clarity AI

A GenAI-powered assistant that makes legal documents easier to understand, compare,
and act on — without replacing a licensed lawyer.

## Problem it solves

Legal documents (leases, employment offers, vendor contracts, terms of service) are
written for lawyers, not for the people who have to sign them. Most people either sign
without understanding what they've agreed to, or pay for a consultation just to get a
plain-language read of a document. Legal Clarity AI closes that gap for the "first
pass": understand the document, spot what's risky, compare it to an alternative, ask
specific questions, and walk into a lawyer conversation (if one is needed) already
prepared with the right questions.

## Features

| Feature | What it does |
|---|---|
| **Simplify** | Rewrites a document into plain language, preserving every obligation/date/amount |
| **Clauses & Risks** | Extracts and categorizes the clauses that matter (obligations, deadlines, money, termination, risk) with a severity rating |
| **Ask a Question** | Answers questions grounded only in the uploaded document, with a supporting quote |
| **Compare** | Diffs two documents (e.g. two contract drafts) by topic and flags what changed |
| **Checklist** | Generates a before-signing checklist, key dates, red flags, and lawyer-ready questions |

Every feature is explicitly framed as **information, not advice** — the UI carries a
persistent disclaimer, and every AI prompt instructs the model to avoid stating legal
conclusions ("this is enforceable/illegal") and instead surface things to raise with a
professional.

## GenAI architecture — explicit mapping

**Service used:** Anthropic Claude API (`claude-sonnet-4-6`), called via the official
`@anthropic-ai/sdk` from Next.js **server-side API routes only** (the API key never
reaches the browser).

| Route | GenAI usage |
|---|---|
| `app/api/simplify/route.ts` | Single-turn completion: rewrites document text into plain language (`lib/prompts.ts → SIMPLIFY_SYSTEM`) |
| `app/api/clauses/route.ts` | Single-turn completion with a **structured JSON output contract**, parsed via `lib/anthropic.ts → extractJson`, to extract categorized/severity-rated clauses (`CLAUSES_SYSTEM`) |
| `app/api/qa/route.ts` | Retrieval-grounded Q&A: the full document text is passed in-context with the question so answers are restricted to what's actually in the document (`QA_SYSTEM`) |
| `app/api/compare/route.ts` | Two-document completion returning structured JSON diffs by topic (`COMPARE_SYSTEM`) |
| `app/api/checklist/route.ts` | Structured JSON generation of an action checklist grounded in the specific document (`CHECKLIST_SYSTEM`) |

All five routes share one call path (`lib/anthropic.ts → callClaude`), which centralizes
model selection, token limits, and error handling — and one document-ingestion path
(`lib/parseDocument.ts`) that extracts text from PDF (`pdf-parse`) and DOCX (`mammoth`)
uploads before it's ever sent to the model.

**Why this shape:** every feature is a single grounded completion (or one JSON-contracted
completion) rather than an agent loop, which keeps latency low, cost predictable, and
output auditable — important for a legal-adjacent tool where hallucinated clauses would
be actively harmful.

## Tech stack

- **Next.js 14** (App Router, TypeScript) — single deployable app, frontend + API routes
- **Tailwind CSS** — styling
- **Anthropic SDK** — GenAI calls
- **pdf-parse / mammoth** — document text extraction
- **Vitest** — unit tests for the JSON-parsing and validation utilities

## Security & privacy notes

- API key lives only in server environment variables (`.env.local`), never shipped to the client.
- Uploaded documents are parsed in-memory per-request and are **not persisted** to disk or a database.
- File size is capped (15MB) and file type is allow-listed to reduce attack surface.
- All user input is length-validated before being sent to the model.
- Every error path returns a generic, non-leaking message to the client while logging details server-side.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Visit http://localhost:3000.

## Testing

```bash
npm test
```

## Limitations (by design)

- Scanned/image-only PDFs aren't OCR'd — text-based PDFs, DOCX, and TXT only.
- No document storage/history — everything is processed per-request and discarded.
- Not jurisdiction-aware and not a substitute for a lawyer, by design (see disclaimer in-app).
