"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { FileSlot, SlotFile } from "./FileSlot";
import { IllustrationBadge } from "./IllustrationBadge";

export function UploadScreen({
  onStart,
  uploadProgress,
}: {
  onStart: (questionPaper: File, answerSheet: File) => void;
  uploadProgress: number | null;
}) {
  const [questionPaper, setQuestionPaper] = useState<SlotFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<SlotFile | null>(null);

  const ready = !!questionPaper && !!answerSheet;
  const uploading = uploadProgress !== null;

  return (
    <div
      className="flex min-h-full flex-1 items-center justify-center py-10"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 30%, rgba(255,255,255,0.9) 0%, rgba(247,247,248,0) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-xl text-center">
        <h1 className="text-xl font-bold leading-snug md:text-2xl">
          Upload{" "}
          <span className="inline-block rounded-lg bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[var(--color-accent)] underline decoration-2 underline-offset-4">
            Question Paper &amp; Answer Sheets
          </span>
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Upload both files to get started</p>

        <div className="my-8 flex justify-center">
          <IllustrationBadge />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FileSlot label="Question Paper" slot={questionPaper} onChange={setQuestionPaper} />
          <FileSlot label="Answer Sheet" slot={answerSheet} onChange={setAnswerSheet} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!ready || uploading}
            onClick={() => ready && onStart(questionPaper!.file, answerSheet!.file)}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
              ready && !uploading
                ? "bg-[var(--color-text)] text-white"
                : "cursor-not-allowed bg-[#e3e3e6] text-[#a6a6ad]"
            }`}
          >
            {uploading ? `Uploading… ${uploadProgress}%` : "Start Mapping"}
            {!uploading && <ArrowRight size={16} />}
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">
            Once both files are uploaded, you&apos;ll be able to map answers with questions
          </p>
        </div>
      </div>
    </div>
  );
}
