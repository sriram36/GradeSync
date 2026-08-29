"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { BBox, PageImage } from "@/lib/types";
import { pageImageUrl } from "@/lib/api";

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

export function AnswerSheetViewer({
  pages,
  bboxes,
  label,
  emptyMessage,
  selectionKey,
}: {
  pages: PageImage[];
  bboxes: BBox[];
  label: string | null;
  emptyMessage?: string;
  /** Identifies "which question/answer is selected". When this changes we
   * jump to the first page containing the new selection's answer. */
  selectionKey: string;
}) {
  const [zoom, setZoom] = useState(100);

  const pagesWithAnswer = useMemo(
    () => Array.from(new Set(bboxes.map((b) => b.page))).sort((a, b) => a - b),
    [bboxes]
  );

  // Reset the visible page whenever the selection changes. Adjusting state
  // directly during render (rather than in a useEffect) avoids the extra
  // "render -> commit -> effect -> re-render" round trip for what is really
  // just derived initial state per selection - React's recommended pattern
  // for "resetting state when a prop changes" (see react.dev: You Might Not
  // Need An Effect).
  const [prevSelectionKey, setPrevSelectionKey] = useState(selectionKey);
  const [pageIndex, setPageIndex] = useState(() => pagesWithAnswer[0] ?? 0);
  if (selectionKey !== prevSelectionKey) {
    setPrevSelectionKey(selectionKey);
    setPageIndex(pagesWithAnswer[0] ?? 0);
  }

  const page = pages[pageIndex];
  const boxesOnPage = bboxes.filter((b) => b.page === pageIndex);

  return (
    <div className="flex h-full flex-col">
      <div className="flex p-4 bg-[var(--color-bg)] pb-0">
        <div className="flex w-full items-center justify-between rounded-t-xl bg-[#303033] px-4 py-2.5 text-white">
          <div className="text-sm font-semibold">Answer Sheet</div>

          <div className="flex flex-1 items-center justify-end gap-3 text-xs">
            <div className="flex items-center rounded-lg bg-[#4b4b4b]/50 px-1 py-0.5">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10"
              >
                <Minus size={13} />
              </button>
              <span className="w-11 text-center font-medium">{zoom}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10"
              >
                <Plus size={13} />
              </button>
            </div>

            {pages.length > 1 && (
              <div className="flex items-center rounded-lg bg-[#4b4b4b]/50 px-1 py-0.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium">
                  Page {pageIndex + 1} of {pages.length}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={pageIndex === pages.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                  className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--color-bg)] p-4">
        {!page ? (
          <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">
            {emptyMessage || "No page to display"}
          </p>
        ) : (
          <div className="mx-auto" style={{ width: `${zoom}%`, maxWidth: 1100, minWidth: 280 }}>
            <div className="relative inline-block w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pageImageUrl(page.url)} alt={`Answer sheet page ${pageIndex + 1}`} className="block w-full" />
              {boxesOnPage.map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-sm border-2 border-[var(--color-success)] bg-[var(--color-success)]/10"
                  style={{
                    left: `${b.x * 100}%`,
                    top: `${b.y * 100}%`,
                    width: `${b.width * 100}%`,
                    height: `${b.height * 100}%`,
                  }}
                >
                  {label && (
                    <span className="absolute -top-6 left-0 rounded-md bg-[var(--color-success)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pagesWithAnswer.length > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-[var(--color-border)] p-3">
          <span className="text-xs text-[var(--color-text-muted)]">This answer spans:</span>
          {pagesWithAnswer.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPageIndex(p)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                p === pageIndex
                  ? "bg-[var(--color-purple)] text-white"
                  : "bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-purple-soft)]"
              }`}
            >
              Page {p + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
