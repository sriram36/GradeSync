"""Very simple in-memory store.

Per the assignment spec, no database or auth is required. Everything lives
in process memory and is lost on restart - fine for a single-teacher demo
session. If this ever needed to survive restarts or multiple workers, swap
this module for Redis without touching the rest of the app (same get/set
shape).
"""
from __future__ import annotations
from typing import Dict, Optional
from threading import Lock

from .models import JobResult

_jobs: Dict[str, JobResult] = {}
_lock = Lock()

# Raw page images (PNG bytes) served back to the frontend for display.
_page_images: Dict[str, bytes] = {}


def create_job(job_id: str) -> JobResult:
    result = JobResult(job_id=job_id, status="processing", stage="uploading")
    with _lock:
        _jobs[job_id] = result
    return result


def update_job(job_id: str, **fields) -> Optional[JobResult]:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return None
        updated = job.model_copy(update=fields)
        _jobs[job_id] = updated
        return updated


def get_job(job_id: str) -> Optional[JobResult]:
    with _lock:
        return _jobs.get(job_id)


def save_page_image(key: str, data: bytes) -> None:
    with _lock:
        _page_images[key] = data


def get_page_image(key: str) -> Optional[bytes]:
    with _lock:
        return _page_images.get(key)
