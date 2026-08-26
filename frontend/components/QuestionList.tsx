"use client";

import { useMemo, useState } from "react";
import type { AnswerBlock, Grade, JobResult, Question } from "@/lib/types";
import { QuestionRow } from "./QuestionRow";

export function QuestionList({
  job,
  activeId,
  onSelectQuestion,
  onSelectUnmatched,
}: {
  job: JobResult;
  activeId: string | null;
  onSelectQuestion: (id: string) => void;
  onSelectUnmatched: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [expandAll, setExpandAll] = useState(false);

  const gradeByQ = useMemo(() => {
    const map = new Map<string, Grade>();
    job.grades.forEach((g) => map.set(g.question_id, g));
    return map;
  }, [job.grades]);

  const mappingByQ = useMemo(() => {
    const map = new Map(job.mappings.map((m) => [m.question_id, m]));
    return map;
  }, [job.mappings]);

  const answersById = useMemo(() => {
    const map = new Map<string, AnswerBlock>();
    job.answer_blocks.forEach((a) => map.set(a.id, a));
    return map;
  }, [job.answer_blocks]);

  const unmatched = job.unmatched_answer_ids
    .map((id) => answersById.get(id))
    .filter((a): a is AnswerBlock => !!a);

  const questions = job.questions
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .filter((q) => q.text.toLowerCase().includes(query.toLowerCase()) || q.display_label.includes(query));

  const answeredCount = job.mappings.filter((m) => m.status !== "unanswered").length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Extracted Questions <span className="font-normal text-[var(--color-text-muted)]">(from question paper)</span></h2>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">
            <span aria-hidden="true" className="text-[var(--color-text-muted)]">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setExpandAll((v) => !v)}
            className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]"
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-bg)] px-3 py-2 text-xs">
          <span className="text-[var(--color-text-muted)]">
            {answeredCount}/{job.questions.length} answered
          </span>
          <span className="font-semibold">
            Total: {job.total_awarded % 1 === 0 ? job.total_awarded : job.total_awarded.toFixed(1)}/
            {job.total_max % 1 === 0 ? job.total_max : job.total_max.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {questions.map((q: Question) => (
          <QuestionRow
            key={q.id}
            question={q}
            grade={gradeByQ.get(q.id)}
            mapping={mappingByQ.get(q.id)}
            expanded={expandAll || activeId === q.id}
            active={activeId === q.id}
            onSelect={() => onSelectQuestion(q.id)}
          />
        ))}

        {unmatched.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <p className="px-3 pb-2 text-xs font-semibold text-[var(--color-text-muted)]">
              Unmatched answers ({unmatched.length})
            </p>
            <p className="px-3 pb-2 text-xs text-[var(--color-text-muted)]">
              Written on the answer sheet but didn&apos;t clearly match any question.
            </p>
            {unmatched.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelectUnmatched(a.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-bg)] ${
                  activeId === a.id ? "bg-[var(--color-accent-soft)]" : ""
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-error-soft)] text-[10px] font-semibold text-[var(--color-error)]">
                  ?
                </span>
                <span className="truncate text-[var(--color-text-muted)]">
                  {a.detected_label ? `"${a.detected_label}" — ` : ""}
                  {a.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
