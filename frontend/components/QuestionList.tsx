"use client";

import { useMemo, useState } from "react";
import { CircleHelp } from "lucide-react";
import type { AnswerBlock, Grade, JobResult, Question } from "@/lib/types";
import { QuestionRow } from "./QuestionRow";

function groupByNumber(questions: Question[]): Question[][] {
  const groups: Question[][] = [];
  for (const q of questions) {
    const last = groups[groups.length - 1];
    if (last && last[0].number === q.number) {
      last.push(q);
    } else {
      groups.push([q]);
    }
  }
  return groups;
}

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
    .sort((a, b) => a.order_index - b.order_index);

  const groups = groupByNumber(questions);
  const answeredCount = job.mappings.filter((m) => m.status !== "unanswered").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--color-text)]">
            Extracted Questions{" "}
          </h2>
          <button
            type="button"
            onClick={() => setExpandAll((v) => !v)}
            className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-text)] shadow-sm border border-[var(--color-border)] hover:bg-gray-50"
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </button>
        </div>
        <p className="text-xs font-medium text-[var(--color-text-muted)]">
          {answeredCount} of {questions.length} answered • {job.total_awarded}/{job.total_max} marks
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {groups.map((group) => {
          return (
            <div key={group[0].number}>
              {group.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  grade={gradeByQ.get(q.id)}
                  mapping={mappingByQ.get(q.id)}
                  expanded={expandAll || activeId === q.id}
                  active={activeId === q.id}
                  onSelect={() => onSelectQuestion(q.id)}
                  badgeLabel={q.sub_part ? `${q.sub_part}.` : undefined}
                  indent={!!q.sub_part}
                />
              ))}
            </div>
          );
        })}

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
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-error-soft)] text-[var(--color-error)]">
                  <CircleHelp size={13} />
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
