"use client";

import { useMemo, useState } from "react";
import type { BBox, PageImage } from "@/lib/types";
import { pageImageUrl } from "@/lib/api";

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

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
  const [zoom, setZoom] = useState<number | "fit">("fit");

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
  const widthStyle = zoom === "fit" ? "100%" : `${zoom}%`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
        <h2 className="text-sm font-semibold">Answer Sheet</h2>
        <div className="flex items-center gap-2">
          <select
            value={zoom}
            onChange={(e) => setZoom(e.target.value === "fit" ? "fit" : Number(e.target.value))}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
          >
            <option value="fit">Fit Page</option>
            {ZOOM_LEVELS.map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--color-bg)] p-4">
        {!page ? (
          <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">
            {emptyMessage || "No page to display"}
          </p>
        ) : (
          <div className="mx-auto" style={{ width: widthStyle, maxWidth: zoom === "fit" ? 900 : "none" }}>
            <div className="relative inline-block w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
              {pages.map((p, i) => (
                <div key={p.page} style={{ display: i === pageIndex ? "block" : "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pageImageUrl(p.url)} alt={`Answer sheet page ${i + 1}`} className="block w-full" />
                </div>
              ))}
              {boxesOnPage.map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-sm border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  style={{
                    left: `${b.x * 100}%`,
                    top: `${b.y * 100}%`,
                    width: `${b.width * 100}%`,
                    height: `${b.height * 100}%`,
                  }}
                >
                  {label && (
                    <span className="absolute -top-6 left-0 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
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
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent-soft)]"
              }`}
            >
              Page {p + 1}
            </button>
          ))}
        </div>
      )}

      {pages.length > 1 && pagesWithAnswer.length <= 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-[var(--color-border)] p-3 text-xs">
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            className="rounded-full px-2 py-1 hover:bg-[var(--color-bg)] disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="text-[var(--color-text-muted)]">
            Page {pageIndex + 1} of {pages.length}
          </span>
          <button
            type="button"
            disabled={pageIndex === pages.length - 1}
            onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
            className="rounded-full px-2 py-1 hover:bg-[var(--color-bg)] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
