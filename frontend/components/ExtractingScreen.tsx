"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkle } from "./Sparkle";

const STAGE_LABELS: Record<string, string> = {
  uploading: "Uploading files…",
  converting_pages: "Reading pages…",
  extracting_questions: "Extracting questions from the paper…",
  extracting_answers: "Reading the student's handwriting…",
  mapping_answers: "Matching answers to questions…",
  grading: "Grading and writing feedback…",
};

const FAKE_LOGS = [
  "[SYS] Initializing AI models...",
  "[SYS] Allocating memory buffers for image streams...",
  "[VISION] Reading PDF page 1 bounding boxes...",
  "[VISION] Isolating text regions and equations...",
  "[VISION] Reading PDF page 2 bounding boxes...",
  "[VISION] Applying OCR to dense text blocks...",
  "[EXTRACT] Found Question 1... assigning ID q_0",
  "[EXTRACT] Found Question 2... assigning ID q_1",
  "[EXTRACT] Found sub-parts in Question 3. Splitting into q_2a, q_2b...",
  "[EXTRACT] Extracting total marks printed on paper...",
  "[VISION] Hand-writing model engaged for student sheet...",
  "[VISION] Tracing ink strokes on page 1...",
  "[VISION] Tracing ink strokes on page 2...",
  "[TRANSCRIPT] 'The derivative of x^2 is 2x' -> Confidence 0.98",
  "[TRANSCRIPT] Found un-labeled diagram... isolating...",
  "[MAP] Analyzing semantic similarity of answer a_3 to question q_1...",
  "[MAP] Strong match found. Linking a_3 -> q_1.",
  "[MAP] Answer a_4 has no clear question. Storing in unmatched...",
  "[MAP] Resolving out-of-order answers across pages...",
  "[GRADE] Evaluating logic steps for q_1...",
  "[GRADE] Final calculation incorrect. Deducting 1 mark.",
  "[GRADE] Generating personalized feedback...",
  "[SYS] Compiling final grading report...",
  "[SYS] Garbage collection complete.",
  "[SYS] Extraction pipeline successful."
];

export function ExtractingScreen({ stage }: { stage?: string | null }) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    // 60000ms / 25 logs = ~2400ms per log
    const interval = setInterval(() => {
      if (currentIndex < FAKE_LOGS.length) {
        setLogs(prev => [...prev, FAKE_LOGS[currentIndex]]);
        currentIndex++;
      }
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Sparkle size={40} className="animate-sparkle text-[var(--color-accent)]" />
        <p className="text-lg font-semibold">Extracting…</p>
        <p className="text-sm text-[var(--color-text-muted)] animate-fade-in-up" key={stage}>
          {stage ? STAGE_LABELS[stage] || "This may take a while" : "This may take a while"}
        </p>
      </div>

      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[#1e1e1f] p-4 shadow-inner overflow-hidden text-left">
        <div className="mb-3 flex gap-2 border-b border-[#333] pb-3">
          <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <div 
          ref={scrollRef}
          className="h-40 overflow-y-auto font-mono text-[12px] text-[#00ff41] opacity-90 leading-loose transition-all scroll-smooth pr-2"
        >
          {logs.length === 0 ? (
            <div className="animate-pulse">Waiting for server allocation...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="animate-fade-in-up">
                &gt; {log}
              </div>
            ))
          )}
          {logs.length > 0 && logs.length < FAKE_LOGS.length && (
            <div className="animate-pulse mt-1 inline-block bg-[#00ff41] w-2 h-3" />
          )}
        </div>
      </div>
    </div>
  );
}
