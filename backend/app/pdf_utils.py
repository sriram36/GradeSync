"""Turns an uploaded file (PDF or image) into a list of page images.

Doing this once, up front, means the rest of the pipeline never has to care
whether the teacher uploaded a PDF or a phone photo - everything downstream
just deals with a list of PIL Images plus their page index.
"""
from __future__ import annotations
from io import BytesIO
from typing import List

import fitz  # PyMuPDF
from PIL import Image

MAX_DIMENSION = 1800  # cap page image size so AI calls stay fast and cheap
RENDER_DPI = 200


def file_to_page_images(file_bytes: bytes, filename: str) -> List[Image.Image]:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _pdf_to_images(file_bytes)
    return [_normalize_image(Image.open(BytesIO(file_bytes)))]


def _pdf_to_images(file_bytes: bytes) -> List[Image.Image]:
    images: List[Image.Image] = []
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        zoom = RENDER_DPI / 72
        matrix = fitz.Matrix(zoom, zoom)
        for page in doc:
            pix = page.get_pixmap(matrix=matrix)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            images.append(_normalize_image(img))
    finally:
        doc.close()
    return images


def _normalize_image(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    if max(img.size) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(img.size)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    return img


def image_to_png_bytes(img: Image.Image) -> bytes:
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def count_pages(file_bytes: bytes, filename: str) -> int:
    if filename.lower().endswith(".pdf"):
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            return doc.page_count
        finally:
            doc.close()
    return 1
