"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import type { Grade, Mapping, Question } from "@/lib/types";
import { formatMarks, marksTone, toneClasses } from "@/lib/grading";
import { Sparkle } from "./Sparkle";

export function QuestionRow({
  question,
  grade,
  mapping,
  expanded,
  active,
  onSelect,
  badgeLabel,
  indent = false,
}: {
  question: Question;
  grade: Grade | undefined;
  mapping: Mapping | undefined;
  expanded: boolean;
  active: boolean;
  onSelect: () => void;
  /** Override what's shown in the round badge - used for sub-parts, which
   * show just "a." rather than repeating the parent number. */
  badgeLabel?: string;
  /** Sub-part rows are indented under their parent number. */
  indent?: boolean;
}) {
  const tone = marksTone(grade);
  const unanswered = !mapping || mapping.status === "unanswered";

  return (
    <div
      className={`mb-3 overflow-hidden rounded-2xl border transition-colors ${
        active ? "border-[var(--color-accent)] bg-white" : "border-[var(--color-border)] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col px-4 py-3 text-left hover:bg-[var(--color-bg)]"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold text-white ${
                active ? "bg-[var(--color-accent)]" : "bg-[#6b6b76]"
              }`}
            >
              {question.number}
            </span>
            {indent && <span className="font-bold text-[var(--color-text)]">{badgeLabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            {unanswered ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses.error}`}>
                {question.max_marks != null ? `0/${question.max_marks}` : "0"}
              </span>
            ) : (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
                {formatMarks(grade)}
              </span>
            )}
            <ChevronDown
              size={18}
              className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
        
        {!expanded && (
          <div className="mt-3 text-sm text-[var(--color-text)] line-clamp-2 pr-6">
            {question.text}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <p className="mt-1 text-sm text-[var(--color-text)]">{question.text}</p>
          {question.max_marks != null && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {question.max_marks} mark{question.max_marks === 1 ? "" : "s"}
              {question.marks_source === "estimated" ? " (estimated)" : ""}
            </p>
          )}
          {grade && (
            <div className="mt-3 rounded-xl border border-[var(--color-accent)] bg-[#fff1ec] p-3">
              <div className="mb-1 text-sm font-bold text-[var(--color-text)]">
                AI Feedback
              </div>
              <p className="text-sm text-[var(--color-text)]">{grade.feedback}</p>
            </div>
          )}
          {mapping?.status === "low_confidence" && (
            <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-error)]">
              <TriangleAlert size={13} />
              This match looks uncertain - worth a manual check.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
