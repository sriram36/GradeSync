"use client";

import { useMemo, useState } from "react";
import type { BBox, JobResult } from "@/lib/types";
import { QuestionList } from "./QuestionList";
import { AnswerSheetViewer } from "./AnswerSheetViewer";

type Selection = { type: "question" | "unmatched"; id: string } | null;

export function MappingScreen({ job }: { job: JobResult }) {
  const [selection, setSelection] = useState<Selection>(
    job.questions.length ? { type: "question", id: job.questions[0].id } : null
  );
  const [mobileTab, setMobileTab] = useState<"questions" | "answer_sheet">("questions");

  const answersById = useMemo(() => new Map(job.answer_blocks.map((a) => [a.id, a])), [job.answer_blocks]);
  const mappingByQ = useMemo(() => new Map(job.mappings.map((m) => [m.question_id, m])), [job.mappings]);
  const questionById = useMemo(() => new Map(job.questions.map((q) => [q.id, q])), [job.questions]);

  let bboxes: BBox[] = [];
  let overlayLabel: string | null = null;
  let emptyMessage: string | undefined;

  if (selection?.type === "question") {
    const question = questionById.get(selection.id);
    const mapping = mappingByQ.get(selection.id);
    const answer = mapping?.answer_block_id ? answersById.get(mapping.answer_block_id) : undefined;
    bboxes = answer?.bboxes ?? [];
    overlayLabel = question?.display_label ?? null;
    if (!answer) emptyMessage = "No matching answer was found on the answer sheet for this question.";
  } else if (selection?.type === "unmatched") {
    const answer = answersById.get(selection.id);
    bboxes = answer?.bboxes ?? [];
    overlayLabel = answer?.detected_label ?? "?";
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Mobile tab switch - segmented pill control matching the Figma reference */}
      <div className="border-b border-[var(--color-border)] p-3 md:hidden">
        <div className="flex gap-1 rounded-full bg-[var(--color-bg)] p-1">
          {(["questions", "answer_sheet"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={`flex-1 rounded-[20px] py-2.5 text-sm font-semibold transition-colors ${
                mobileTab === tab
                  ? "bg-[#303033] text-white shadow-sm"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              }`}
            >
              {tab === "questions" ? "Questions" : "Answer Sheet"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2 gap-4">
        <div className={`min-h-0 overflow-hidden ${mobileTab === "questions" ? "block" : "hidden md:block"}`}>
          <QuestionList
            job={job}
            activeId={selection?.id ?? null}
            onSelectQuestion={(id) => {
              setSelection({ type: "question", id });
              setMobileTab("answer_sheet");
            }}
            onSelectUnmatched={(id) => {
              setSelection({ type: "unmatched", id });
              setMobileTab("answer_sheet");
            }}
          />
        </div>
        <div className={`min-h-0 overflow-hidden ${mobileTab === "answer_sheet" ? "block" : "hidden md:block"}`}>
          <AnswerSheetViewer
            pages={job.answer_sheet_pages}
            bboxes={bboxes}
            label={overlayLabel}
            emptyMessage={emptyMessage}
            selectionKey={selection ? `${selection.type}:${selection.id}` : "none"}
          />
        </div>
      </div>
    </div>
  );
}
