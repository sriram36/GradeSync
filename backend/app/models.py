from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class BBox(BaseModel):
    """Normalized bounding box. x, y, width, height are all fractions (0-1)
    of the page image's width/height. `page` is 0-indexed within that file."""
    page: int
    x: float
    y: float
    width: float
    height: float


class Question(BaseModel):
    id: str
    number: str                      # printed number as it appears, e.g. "11"
    sub_part: Optional[str] = None   # e.g. "a" for "11 (a)"
    display_label: str               # e.g. "11 (a)" or "3"
    text: str
    max_marks: Optional[float] = None
    marks_source: Literal["printed", "estimated"] = "estimated"
    bbox: Optional[BBox] = None
    order_index: int


class AnswerBlock(BaseModel):
    id: str
    detected_label: Optional[str] = None   # label student wrote, if any, e.g. "Q3" / "11(a)" / null
    text: str                              # transcribed answer text
    bboxes: List[BBox] = Field(default_factory=list)  # can span multiple pages
    order_index: int


class Mapping(BaseModel):
    question_id: str
    answer_block_id: Optional[str] = None
    confidence: float = 0.0
    status: Literal["answered", "unanswered", "low_confidence"] = "unanswered"


class Grade(BaseModel):
    question_id: str
    marks_awarded: float
    max_marks: float
    correct: Optional[bool] = None
    feedback: str


class PageImage(BaseModel):
    page: int
    url: str
    width: int
    height: int


class JobStatus(BaseModel):
    job_id: str
    status: Literal["processing", "done", "error"]
    stage: Optional[str] = None
    error: Optional[str] = None


class JobResult(BaseModel):
    job_id: str
    status: Literal["processing", "done", "error"]
    stage: Optional[str] = None
    error: Optional[str] = None
    questions: List[Question] = Field(default_factory=list)
    answer_blocks: List[AnswerBlock] = Field(default_factory=list)
    mappings: List[Mapping] = Field(default_factory=list)
    grades: List[Grade] = Field(default_factory=list)
    unmatched_answer_ids: List[str] = Field(default_factory=list)
    question_paper_pages: List[PageImage] = Field(default_factory=list)
    answer_sheet_pages: List[PageImage] = Field(default_factory=list)
    total_awarded: float = 0.0
    total_max: float = 0.0
