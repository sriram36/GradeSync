"use client";

import { useState } from "react";
import { FileSlot, SlotFile } from "./FileSlot";

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
    <div className="mx-auto w-full max-w-2xl py-10 md:py-14">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10">
        <h1 className="text-xl font-semibold md:text-2xl">
          Upload <span className="text-[var(--color-accent)]">Question Paper &amp; Answer Sheets</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Upload both files to get started</p>

        <div className="my-8 flex justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-accent-soft)] text-3xl">
            👩‍🏫
          </div>
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
            className="flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-30"
          >
            {uploading ? `Uploading… ${uploadProgress}%` : "Start Mapping"}
            {!uploading && <span aria-hidden="true">→</span>}
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">
            Once both files are uploaded, you&apos;ll be able to map answers with questions
          </p>
        </div>
      </div>
    </div>
  );
}
