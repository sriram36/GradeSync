"use client";

import { Sparkle } from "./Sparkle";

export function TopBar({ onBack, breadcrumb = "Exams" }: { onBack?: () => void; breadcrumb?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] disabled:cursor-default"
      >
        <span aria-hidden="true">←</span>
        <span>{breadcrumb}</span>
      </button>

      <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
        <button type="button" aria-label="Help" className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--color-bg)]">
          ?
        </button>
        <button type="button" aria-label="Notifications" className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--color-bg)]">
          🔔
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Sparkle size={15} />
        </span>
        <div className="flex items-center gap-2 pl-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-purple-soft)] text-xs font-semibold text-[var(--color-purple)]">
            SK
          </div>
          <span className="hidden text-sm font-medium sm:inline">Sriram Kolli</span>
        </div>
      </div>
    </header>
  );
}
