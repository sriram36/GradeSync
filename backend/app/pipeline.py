from __future__ import annotations
import json
from typing import List, Tuple

from PIL import Image

from . import prompts
from .ai_provider import AIProvider
from .models import Question, AnswerBlock, Mapping, Grade, BBox


def extract_questions(provider: AIProvider, images: List[Image.Image]) -> List[Question]:
    data = provider.generate_json(
        prompts.QUESTION_EXTRACTION_SYSTEM,
        prompts.QUESTION_EXTRACTION_USER,
        images=images,
    )
    questions: List[Question] = []
    for i, q in enumerate(data.get("questions", [])):
        bbox = None
        if q.get("bbox"):
            bbox = BBox(page=q.get("page", 0), **q["bbox"])
        questions.append(Question(
            id=f"q_{i}",
            number=str(q.get("number", i + 1)),
            sub_part=q.get("sub_part"),
            display_label=q.get("display_label") or str(q.get("number", i + 1)),
            text=q.get("text", ""),
            max_marks=q.get("max_marks"),
            marks_source=q.get("marks_source", "estimated"),
            bbox=bbox,
            order_index=i,
        ))
    return questions


def extract_answers(provider: AIProvider, images: List[Image.Image]) -> List[AnswerBlock]:
    data = provider.generate_json(
        prompts.ANSWER_EXTRACTION_SYSTEM,
        prompts.ANSWER_EXTRACTION_USER,
        images=images,
    )
    blocks: List[AnswerBlock] = []
    for i, a in enumerate(data.get("answer_blocks", [])):
        bboxes = [BBox(**b) for b in a.get("bboxes", [])]
        blocks.append(AnswerBlock(
            id=f"a_{i}",
            detected_label=a.get("detected_label"),
            text=a.get("text", ""),
            bboxes=bboxes,
            order_index=a.get("order_index", i),
        ))
    return blocks


def map_answers(provider: AIProvider, questions: List[Question],
                 answers: List[AnswerBlock]) -> Tuple[List[Mapping], List[str]]:
    questions_json = json.dumps([
        {"id": q.id, "display_label": q.display_label, "text": q.text} for q in questions
    ])
    answers_json = json.dumps([
        {"id": a.id, "detected_label": a.detected_label, "text": a.text} for a in answers
    ])
    user_prompt = prompts.MAPPING_USER.format(questions_json=questions_json, answers_json=answers_json)
    data = provider.generate_json(prompts.MAPPING_SYSTEM, user_prompt)

    mapped_question_ids = set()
    mappings: List[Mapping] = []
    for m in data.get("mappings", []):
        mappings.append(Mapping(
            question_id=m["question_id"],
            answer_block_id=m.get("answer_block_id"),
            confidence=m.get("confidence", 0.0),
            status=m.get("status", "unanswered"),
        ))
        mapped_question_ids.add(m["question_id"])

    # Any question the model didn't mention at all is unanswered.
    for q in questions:
        if q.id not in mapped_question_ids:
            mappings.append(Mapping(question_id=q.id, answer_block_id=None,
                                     confidence=0.0, status="unanswered"))

    unmatched = data.get("unmatched_answer_ids", [])
    return mappings, unmatched


def grade_answers(provider: AIProvider, questions: List[Question], answers: List[AnswerBlock],
                   mappings: List[Mapping]) -> List[Grade]:
    """Grades every answered question in a single batched AI call (keeps this
    within free-tier rate limits instead of one call per question)."""
    answers_by_id = {a.id: a for a in answers}
    mapping_by_q = {m.question_id: m for m in mappings}

    grades: List[Grade] = []
    pairs = []  # what we actually send to the grader
    max_marks_by_id = {}

    for q in questions:
        max_marks = q.max_marks or 5
        max_marks_by_id[q.id] = max_marks
        mapping = mapping_by_q.get(q.id)
        answer = answers_by_id.get(mapping.answer_block_id) if mapping and mapping.answer_block_id else None

        if not mapping or not answer or mapping.status == "unanswered":
            grades.append(Grade(question_id=q.id, marks_awarded=0, max_marks=max_marks,
                                 correct=False, feedback=prompts.UNANSWERED_FEEDBACK))
            continue

        pairs.append({
            "question_id": q.id, "max_marks": max_marks,
            "question_text": q.text, "answer_text": answer.text,
        })

    if pairs:
        user_prompt = prompts.GRADING_USER.format(pairs_json=json.dumps(pairs))
        data = provider.generate_json(prompts.GRADING_SYSTEM, user_prompt)
        for g in data.get("grades", []):
            qid = g.get("question_id")
            max_marks = max_marks_by_id.get(qid, 5)
            grades.append(Grade(
                question_id=qid,
                marks_awarded=min(max(float(g.get("marks_awarded", 0)), 0), max_marks),
                max_marks=max_marks,
                correct=g.get("correct"),
                feedback=g.get("feedback", ""),
            ))

    return grades


def run_pipeline(provider: AIProvider, qp_images: List[Image.Image],
                  as_images: List[Image.Image]):
    """Runs the full flow and returns (questions, answers, mappings, unmatched_ids, grades)."""
    questions = extract_questions(provider, qp_images)
    answers = extract_answers(provider, as_images)
    mappings, unmatched_ids = map_answers(provider, questions, answers)
    grades = grade_answers(provider, questions, answers, mappings)
    return questions, answers, mappings, unmatched_ids, grades
