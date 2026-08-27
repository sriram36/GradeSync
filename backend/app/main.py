from __future__ import annotations
import os
import uuid
import traceback

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool

from . import storage, pipeline
from .ai_provider import get_provider
from .pdf_utils import file_to_page_images
from .models import JobResult, PageImage, JobStatus

app = FastAPI(title="VedaAI Assessment Mapper")

origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _save_pages(job_id: str, file_type: str, images: list[dict]) -> list[PageImage]:
    pages = []
    for i, img in enumerate(images):
        key = f"{job_id}:{file_type}:{i}"
        storage.save_page_image(key, img["bytes"])
        pages.append(PageImage(page=i, url=f"/api/jobs/{job_id}/pages/{file_type}/{i}",
                                width=img["width"], height=img["height"]))
    return pages


def _process_job(job_id: str, qp_bytes: bytes, qp_name: str, as_bytes: bytes, as_name: str):
    try:
        storage.update_job(job_id, stage="converting_pages")
        qp_images = file_to_page_images(qp_bytes, qp_name)
        del qp_bytes  # Force free memory
        as_images = file_to_page_images(as_bytes, as_name)
        del as_bytes  # Force free memory

        qp_pages = _save_pages(job_id, "question_paper", qp_images)
        as_pages = _save_pages(job_id, "answer_sheet", as_images)
        storage.update_job(job_id, question_paper_pages=qp_pages, answer_sheet_pages=as_pages)

        provider = get_provider()

        import concurrent.futures
        import gc
        gc.collect()  # Force garbage collection before parallel spike

        storage.update_job(job_id, stage="extracting_questions")
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_questions = executor.submit(pipeline.extract_questions, provider, qp_images)
            future_answers = executor.submit(pipeline.extract_answers, provider, as_images)
            
            questions = future_questions.result()
            answers = future_answers.result()

        del qp_images
        del as_images
        gc.collect()  # Clean up immediately

        storage.update_job(job_id, stage="mapping_answers")
        mappings, unmatched = pipeline.map_answers(provider, questions, answers)

        storage.update_job(job_id, stage="grading")
        grades = pipeline.grade_answers(provider, questions, answers, mappings)

        total_awarded = sum(g.marks_awarded for g in grades)
        total_max = sum(g.max_marks for g in grades)

        storage.update_job(
            job_id, status="done", stage="done",
            questions=questions, answer_blocks=answers, mappings=mappings,
            grades=grades, unmatched_answer_ids=unmatched,
            total_awarded=total_awarded, total_max=total_max,
        )
    except Exception as exc:  # noqa: BLE001 - surface any failure to the frontend
        traceback.print_exc()
        storage.update_job(job_id, status="error", error=str(exc))


@app.post("/api/jobs", response_model=JobStatus)
async def create_job(question_paper: UploadFile = File(...), answer_sheet: UploadFile = File(...)):
    job_id = uuid.uuid4().hex[:12]
    storage.create_job(job_id)

    qp_bytes = await question_paper.read()
    as_bytes = await answer_sheet.read()

    # Runs synchronously (in a threadpool) and the request blocks until done.
    # Simple and reliable for a single-teacher demo; the frontend shows an
    # "Extracting..." state for the duration of this call.
    await run_in_threadpool(
        _process_job, job_id, qp_bytes, question_paper.filename or "question_paper.pdf",
        as_bytes, answer_sheet.filename or "answer_sheet.pdf",
    )

    job = storage.get_job(job_id)
    return JobStatus(job_id=job.job_id, status=job.status, stage=job.stage, error=job.error)


@app.get("/api/jobs/{job_id}", response_model=JobResult)
async def get_job(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/jobs/{job_id}/pages/{file_type}/{page}")
async def get_page(job_id: str, file_type: str, page: int):
    key = f"{job_id}:{file_type}:{page}"
    data = storage.get_page_image(key)
    if data is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return Response(content=data, media_type="image/jpeg")


@app.get("/api/health")
async def health():
    return {"ok": True}
