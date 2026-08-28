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

const STAGE_LOGS: Record<string, string[]> = {
  uploading: ["[SYS] Receiving file streams...", "[SYS] Verifying PDF integrity..."],
  converting_pages: ["[SYS] Converting PDF pages to memory buffers...", "[VISION] Preparing image extraction pipeline..."],
  extracting_questions: ["[VISION] Scanning question paper for bounding boxes...", "[EXTRACT] Applying OCR and grouping sub-parts..."],
  extracting_answers: ["[VISION] Engaging handwriting transcription models...", "[TRANSCRIPT] Tracing ink strokes and digitizing student answers..."],
  mapping_answers: ["[MAP] Running semantic similarity matching...", "[MAP] Aligning out-of-order answers to questions..."],
  grading: ["[GRADE] Evaluating logic and assigning marks...", "[GRADE] Generating personalized feedback...", "[SYS] Compiling final report..."]
};

export function ExtractingScreen({ stage }: { stage?: string | null }) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When the actual backend stage changes, push the relevant logs sequentially
  useEffect(() => {
    if (!stage || !STAGE_LOGS[stage]) return;
    
    const newLogs = STAGE_LOGS[stage];
    let currentIndex = 0;
    
    // Push the logs for the current stage one by one to simulate typing/processing
    const interval = setInterval(() => {
      if (currentIndex < newLogs.length) {
        const logToPush = newLogs[currentIndex];
        setLogs(prev => [...prev, logToPush]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [stage]);

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
          {logs.length > 0 && (
            <div className="animate-pulse mt-1 inline-block bg-[#00ff41] w-2 h-3" />
          )}
        </div>
      </div>
    </div>
  );
}
