"use client";

import { ArrowLeft, ClipboardList, CircleHelp, Bell, ChevronDown, Menu } from "lucide-react";
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
        <ArrowLeft size={16} />
        {/* Desktop: page breadcrumb (logo already lives in the sidebar) */}
        <span className="hidden items-center gap-1.5 md:flex">
          <ClipboardList size={14} />
          {breadcrumb}
        </span>
        {/* Mobile: brand name (no sidebar visible to carry it) */}
        <span className="text-base font-semibold text-[var(--color-text)] md:hidden">VedaAI</span>
      </button>

      <div className="flex items-center gap-1 text-[var(--color-text-muted)] sm:gap-2">
        <button type="button" aria-label="Help" className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--color-bg)]">
          <CircleHelp size={18} />
        </button>
        <button type="button" aria-label="Notifications" className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--color-bg)]">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>
        <button type="button" aria-label="AI Toolkit" className="hidden h-8 w-8 place-items-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-bg)] sm:grid">
          <Sparkle size={17} />
        </button>
        <button type="button" className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 hover:bg-[var(--color-bg)] sm:pl-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="h-full w-full object-cover" />
          </div>
          <span className="hidden text-sm font-medium text-[var(--color-text)] sm:inline">Madhur Rastogi</span>
          <ChevronDown size={14} className="hidden sm:inline" />
        </button>
        {/* Mobile: hamburger for the nav drawer (nav lives in the sidebar on desktop) */}
        <button type="button" aria-label="Menu" className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--color-bg)] md:hidden">
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
