"use client";

import { useId, useState } from "react";

export interface DocValue {
  text?: string;
  file?: File;
}

export default function DocInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DocValue;
  onChange: (v: DocValue) => void;
}) {
  const [mode, setMode] = useState<"paste" | "upload">(value.file ? "upload" : "paste");
  const textId = useId();
  const fileId = useId();

  return (
    <fieldset className="border border-ink/15 rounded-md p-4 bg-white/40">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-2 mb-3" role="radiogroup" aria-label={`${label} input mode`}>
        {(["paste", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`focus-ring text-xs px-3 py-1.5 rounded border transition-colors ${
              mode === m
                ? "bg-ink text-paper border-ink"
                : "bg-transparent text-ink/70 border-ink/25 hover:border-ink/50"
            }`}
          >
            {m === "paste" ? "Paste text" : "Upload file"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <div>
          <label htmlFor={textId} className="sr-only">
            {label} text
          </label>
          <textarea
            id={textId}
            className="focus-ring w-full min-h-[160px] rounded border border-ink/20 p-3 text-sm font-doc bg-white leading-relaxed"
            placeholder="Paste the document text here…"
            value={value.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      ) : (
        <div>
          <label htmlFor={fileId} className="sr-only">
            {label} file upload
          </label>
          <input
            id={fileId}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="focus-ring w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-ink file:text-paper file:px-3 file:py-2 file:text-sm file:cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0];
              onChange({ file: f });
            }}
          />
          <p className="text-xs text-ink/50 mt-2">PDF, DOCX, or TXT — up to 15MB.</p>
          {value.file && (
            <p className="text-xs text-stamp mt-1" aria-live="polite">
              Selected: {value.file.name}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
