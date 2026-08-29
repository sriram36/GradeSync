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
      className={`rounded-xl border transition-colors ${indent ? "ml-8" : ""} ${
        active ? "border-[var(--color-accent)]" : "border-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[var(--color-bg)] ${
          active ? "bg-[var(--color-accent-soft)]" : ""
        }`}
      >
        <span
          className={`grid shrink-0 place-items-center rounded-full bg-[var(--color-purple-soft)] font-semibold text-[var(--color-purple)] ${
            indent ? "h-6 w-6 text-[11px]" : "h-7 w-7 text-xs"
          }`}
        >
          {badgeLabel ?? question.display_label}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">
          {question.text}
        </span>
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
          size={16}
          className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="space-y-3 px-3 pb-4 pt-1">
          <p className="text-sm text-[var(--color-text-muted)]">{question.text}</p>
          {question.max_marks != null && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {question.max_marks} mark{question.max_marks === 1 ? "" : "s"}
              {question.marks_source === "estimated" ? " (estimated - not printed on paper)" : ""}
            </p>
          )}
          {grade && (
            <div className="rounded-xl border border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)]/60 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)]">
                <Sparkle size={13} />
                AI Feedback
              </div>
              <p className="text-sm text-[var(--color-text)]">{grade.feedback}</p>
            </div>
          )}
          {mapping?.status === "low_confidence" && (
            <p className="flex items-center gap-1 text-xs text-[var(--color-error)]">
              <TriangleAlert size={13} />
              This match looks uncertain - worth a manual check.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
