"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UploadScreen } from "@/components/UploadScreen";
import { ExtractingScreen } from "@/components/ExtractingScreen";
import { MappingScreen } from "@/components/MappingScreen";
import { createJob, getJob } from "@/lib/api";
import type { JobResult } from "@/lib/types";

type Stage = "upload" | "extracting" | "mapping" | "error";

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ping the backend immediately on load to wake up the free tier server
  // (e.g. Render/Railway cold starts) before the user even hits upload.
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/health`)
      .catch(() => {}); // silent catch, it's just a wakeup ping
  }, []);

  async function handleStart(questionPaper: File, answerSheet: File) {
    setError(null);
    setUploadProgress(0);
    try {
      const status = await createJob(questionPaper, answerSheet, (pct) => {
        setUploadProgress(pct);
        if (pct >= 100) {
          setStage("extracting");
          setProcessingStage("converting_pages");
        }
      });

      if (status.status === "error") {
        setError(status.error || "Something went wrong while processing your files.");
        setStage("error");
        return;
      }

      // Poll the backend every 2 seconds until the job is done.
      const pollBackend = async () => {
        let result = await getJob(status.job_id);
        while (result.status === "processing") {
          setProcessingStage(result.stage || "extracting_questions");
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = await getJob(status.job_id);
        }
        return result;
      };

      const result = await pollBackend();

      if (result.status === "error") {
        setError(result.error || "Something went wrong while processing your files.");
        setStage("error");
        return;
      }
      
      setJob(result);
      setStage("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    } finally {
      setUploadProgress(null);
    }
  }

  function reset() {
    setStage("upload");
    setJob(null);
    setError(null);
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      <Sidebar collapsed={stage !== "upload"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onBack={stage !== "upload" ? reset : undefined} />

        {stage === "mapping" && job ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <MappingScreen job={job} />
          </div>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 md:px-6">
            {stage === "upload" && (
              <UploadScreen onStart={handleStart} uploadProgress={uploadProgress} />
            )}
            {stage === "extracting" && <ExtractingScreen stage={processingStage} />}
            {stage === "error" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-lg font-semibold text-[var(--color-error)]">Extraction failed</p>
                <p className="max-w-md text-sm text-[var(--color-text-muted)]">{error}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 rounded-full bg-[var(--color-text)] px-5 py-2.5 text-sm font-medium text-white"
                >
                  Try again
                </button>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
