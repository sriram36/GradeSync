"use client";

import { Sparkle } from "./Sparkle";

const NAV_ITEMS = [
  { label: "Home", active: false },
  { label: "My Classroom", active: false },
  { label: "Assignments", active: false },
  { label: "Exams", active: true },
  { label: "My Library", active: false },
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <aside className="hidden md:flex w-16 shrink-0 flex-col items-center gap-4 border-r border-[var(--color-border)] bg-[var(--color-surface)] py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-text)] text-white font-semibold">
          V
        </div>
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Sparkle size={16} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-text)] text-white font-semibold text-sm">
          V
        </div>
        <span className="font-semibold text-[15px]">VedaAI</span>
      </div>

      <button
        type="button"
        className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--color-text)] px-3 py-2.5 text-sm font-medium text-white"
      >
        <Sparkle size={15} className="text-[var(--color-accent)]" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            title="This is a static demo shell - only Exams is wired up"
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              item.active
                ? "bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-purple-soft)] text-sm">
          🏫
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">VedaAI Academy</p>
          <p className="truncate text-[11px] text-[var(--color-text-muted)]">HQ</p>
        </div>
      </div>
    </aside>
  );
}
