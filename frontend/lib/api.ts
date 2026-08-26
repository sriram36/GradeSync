import type { JobResult, JobStatus } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/**
 * Uploads both files with progress reporting (via XHR, since fetch doesn't
 * expose upload progress) and resolves once the backend has finished the
 * full extract -> map -> grade pipeline.
 */
export function createJob(
  questionPaper: File,
  answerSheet: File,
  onProgress: (pct: number) => void
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("question_paper", questionPaper);
    form.append("answer_sheet", answerSheet);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/jobs`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(form);
  });
}

export async function getJob(jobId: string): Promise<JobResult> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to load job ${jobId}`);
  return res.json();
}

export function pageImageUrl(path: string): string {
  return `${API_BASE}${path}`;
}
