import type { Grade } from "./types";

export function marksTone(grade: Grade | undefined): "success" | "error" | "muted" {
  if (!grade || grade.max_marks <= 0) return "muted";
  const ratio = grade.marks_awarded / grade.max_marks;
  return ratio >= 0.5 ? "success" : "error";
}

export const toneClasses: Record<"success" | "error" | "muted", string> = {
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  error: "bg-[var(--color-error-soft)] text-[var(--color-error)]",
  muted: "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
};

export function formatMarks(grade: Grade | undefined): string {
  if (!grade) return "—";
  const awarded = Number.isInteger(grade.marks_awarded)
    ? grade.marks_awarded
    : grade.marks_awarded.toFixed(1);
  const max = Number.isInteger(grade.max_marks) ? grade.max_marks : grade.max_marks.toFixed(1);
  return `${awarded}/${max}`;
}
