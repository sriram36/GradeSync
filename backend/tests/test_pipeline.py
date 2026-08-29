"""End-to-end test of the /api/jobs pipeline using a fake AI provider, so it
runs without a real Gemini/Azure key and without network access. Covers the
main edge cases the assignment calls out: an answered question, an
unanswered question, and an answer that doesn't match any question."""
import os
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-used")

import io
import fitz
import pytest
from fastapi.testclient import TestClient

from app import main, prompts
from app.ai_provider import AIProvider


class FakeProvider(AIProvider):
    """Returns canned responses keyed by which system prompt is used, so this
    stands in for extraction, mapping, and grading calls without hitting a
    real API."""

    def generate_json(self, system_prompt, user_prompt, images=None):
        if system_prompt == prompts.QUESTION_EXTRACTION_SYSTEM:
            return {
                "questions": [
                    {"number": "1", "sub_part": None, "display_label": "1", "text": "What is 2+2?",
                     "max_marks": 2, "marks_source": "printed", "page": 0,
                     "bbox": {"x": 0.1, "y": 0.1, "width": 0.5, "height": 0.05}},
                    {"number": "2", "sub_part": None, "display_label": "2", "text": "Explain gravity.",
                     "max_marks": 5, "marks_source": "printed", "page": 0,
                     "bbox": {"x": 0.1, "y": 0.2, "width": 0.5, "height": 0.05}},
                ]
            }
        if system_prompt == prompts.ANSWER_EXTRACTION_SYSTEM:
            return {
                "answer_blocks": [
                    {"detected_label": "Q1", "text": "4", "order_index": 0,
                     "bboxes": [{"page": 0, "x": 0.1, "y": 0.1, "width": 0.3, "height": 0.05}]},
                    {"detected_label": None, "text": "Random scratch notes unrelated to anything",
                     "order_index": 1,
                     "bboxes": [{"page": 0, "x": 0.1, "y": 0.5, "width": 0.3, "height": 0.05}]},
                ]
            }
        if system_prompt == prompts.MAPPING_SYSTEM:
            # Question 2 ("Explain gravity") deliberately gets no match, to
            # exercise the "unanswered question" path. The scratch-notes
            # answer deliberately gets no match either, to exercise the
            # "unmatched answer" path.
            return {
                "mappings": [
                    {"question_id": "q_0", "answer_block_id": "a_0", "confidence": 0.95, "status": "answered"},
                ],
                "unmatched_answer_ids": ["a_1"],
            }
        if system_prompt == prompts.GRADING_SYSTEM:
            return {"grades": [{"question_id": "q_0", "marks_awarded": 2, "correct": True, "feedback": "Correct!"}]}
        raise AssertionError(f"unexpected system prompt: {system_prompt!r}")


@pytest.fixture(autouse=True)
def fake_ai(monkeypatch):
    monkeypatch.setattr(main, "get_provider", lambda: FakeProvider())


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Q1. What is 2+2? (2 marks)")
    page.insert_text((72, 100), "Q2. Explain gravity. (5 marks)")
    buf = io.BytesIO(doc.tobytes())
    doc.close()
    return buf.getvalue()


@pytest.fixture
def client():
    return TestClient(main.app)


def test_full_pipeline(client, sample_pdf_bytes):
    resp = client.post(
        "/api/jobs",
        files={
            "question_paper": ("qp.pdf", sample_pdf_bytes, "application/pdf"),
            "answer_sheet": ("ans.pdf", sample_pdf_bytes, "application/pdf"),
        },
    )
    import time
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    assert resp.json()["status"] == "processing"

    result = client.get(f"/api/jobs/{job_id}").json()
    while result["status"] == "processing":
        time.sleep(0.1)
        result = client.get(f"/api/jobs/{job_id}").json()

    assert result["status"] == "done"
    assert len(result["questions"]) == 2
    assert len(result["answer_blocks"]) == 2

    mapping_by_q = {m["question_id"]: m for m in result["mappings"]}
    assert mapping_by_q["q_0"]["status"] == "answered"
    assert mapping_by_q["q_1"]["status"] == "unanswered"  # unanswered-question edge case

    assert result["unmatched_answer_ids"] == ["a_1"]  # unmatched-answer edge case

    grade_by_q = {g["question_id"]: g for g in result["grades"]}
    assert grade_by_q["q_0"]["marks_awarded"] == 2
    assert grade_by_q["q_1"]["marks_awarded"] == 0  # unanswered -> zero, not left blank

    assert result["total_awarded"] == 2
    assert result["total_max"] == 7


def test_page_image_is_served_as_jpeg(client, sample_pdf_bytes):
    resp = client.post(
        "/api/jobs",
        files={
            "question_paper": ("qp.pdf", sample_pdf_bytes, "application/pdf"),
            "answer_sheet": ("ans.pdf", sample_pdf_bytes, "application/pdf"),
        },
    )
    import time
    job_id = resp.json()["job_id"]
    result = client.get(f"/api/jobs/{job_id}").json()
    while result["status"] == "processing":
        time.sleep(0.1)
        result = client.get(f"/api/jobs/{job_id}").json()

    page_url = result["question_paper_pages"][0]["url"]
    page_resp = client.get(page_url)

    assert page_resp.status_code == 200
    assert page_resp.headers["content-type"] == "image/jpeg"
    assert page_resp.content[:2] == b"\xff\xd8"


def test_missing_job_returns_404(client):
    assert client.get("/api/jobs/does-not-exist").status_code == 404
    assert client.get("/api/jobs/does-not-exist/pages/question_paper/0").status_code == 404
