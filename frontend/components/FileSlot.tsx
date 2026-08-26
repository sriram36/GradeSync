"use client";

import { useRef, useState } from "react";
import { estimatePdfPageCount } from "@/lib/pdfPageCount";

const ACCEPT = ".pdf,.png,.jpg,.jpeg";
const MAX_MB = 10;

export type SlotFile = {
  file: File;
  pages: number | null;
};

export function FileSlot({
  label,
  slot,
  onChange,
}: {
  label: string;
  slot: SlotFile | null;
  onChange: (slot: SlotFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is over ${MAX_MB}MB`);
      return;
    }
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const pages = isPdf ? await estimatePdfPageCount(file) : 1;
    onChange({ file, pages });
  }

  if (slot) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-error-soft)] text-[var(--color-error)] text-xs font-bold">
          {slot.file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{slot.file.name}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {(slot.file.size / (1024 * 1024)).toFixed(1)}MB
            {slot.pages ? ` • ${slot.pages} Page${slot.pages > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={() => onChange(null)}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-error-soft)] hover:text-[var(--color-error)]"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
        }`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-bg)] text-[var(--color-text-muted)]">
          ↑
        </span>
        <span className="text-sm">
          Upload <span className="font-semibold text-[var(--color-accent)]">{label}</span>
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">Max {MAX_MB}MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
