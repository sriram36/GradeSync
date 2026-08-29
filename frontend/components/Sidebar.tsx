"use client";

import {
  LayoutGrid,
  MonitorPlay,
  ClipboardList,
  FileCheck2,
  Folder,
  Settings,
  PanelLeftClose,
} from "lucide-react";
import { Sparkle } from "./Sparkle";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutGrid, active: false },
  { label: "My Classroom", icon: MonitorPlay, active: false },
  { label: "Assignments", icon: ClipboardList, active: false },
  { label: "Exams", icon: FileCheck2, active: true },
  { label: "My Library", icon: Folder, active: false },
];

export function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  if (collapsed) {
    return (
      <aside className="hidden md:flex w-16 shrink-0 flex-col items-center gap-3 border-r border-[var(--color-border)] bg-[var(--color-surface)] py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-text)] text-white font-semibold">
          V
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mt-1 grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-text)] text-white"
        >
          <Sparkle size={16} className="text-[var(--color-accent)]" />
        </button>
        <div className="mt-2 flex flex-col items-center gap-3 text-[var(--color-text-muted)]">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              title={label}
              className={`grid h-9 w-9 place-items-center rounded-lg ${
                active ? "bg-[var(--color-bg)] text-[var(--color-text)]" : ""
              }`}
            >
              <Icon size={17} strokeWidth={2} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-text)] text-white font-semibold text-sm">
            V
          </div>
          <span className="font-semibold text-[15px]">VedaAI</span>
        </div>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="grid h-7 w-7 place-items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <button
        type="button"
        className="mt-5 flex items-center gap-2 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-text)] px-3 py-2.5 text-sm font-medium text-white"
      >
        <Sparkle size={15} className="text-[var(--color-accent)]" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            title="This is a static demo shell - only Exams is wired up"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              active
                ? "bg-[var(--color-bg)] font-medium text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        title="This is a static demo shell"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
      >
        <Settings size={16} strokeWidth={2} />
        Settings
      </button>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--color-bg)] px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c4ed8] text-white font-bold text-sm shadow-sm">
          D
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[var(--color-text)]">Delhi Public School</p>
          <p className="truncate text-[11px] text-[var(--color-text-muted)]">Bokaro Steel City</p>
        </div>
      </div>
    </aside>
  );
}
