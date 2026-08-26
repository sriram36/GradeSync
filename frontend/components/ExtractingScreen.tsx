import { Sparkle } from "./Sparkle";

const STAGE_LABELS: Record<string, string> = {
  uploading: "Uploading files…",
  converting_pages: "Reading pages…",
  extracting_questions: "Extracting questions from the paper…",
  extracting_answers: "Reading the student's handwriting…",
  mapping_answers: "Matching answers to questions…",
  grading: "Grading and writing feedback…",
};

export function ExtractingScreen({ stage }: { stage?: string | null }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Sparkle size={40} className="animate-sparkle text-[var(--color-accent)]" />
      <p className="text-lg font-semibold">Extracting…</p>
      <p className="text-sm text-[var(--color-text-muted)]">
        {stage ? STAGE_LABELS[stage] || "This may take a while" : "This may take a while"}
      </p>
    </div>
  );
}
