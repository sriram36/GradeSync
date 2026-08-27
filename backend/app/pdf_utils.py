"""Turns an uploaded file (PDF or image) into a list of page images.

Doing this once, up front, means the rest of the pipeline never has to care
whether the teacher uploaded a PDF or a phone photo - everything downstream
just deals with a list of PIL Images plus their page index.
"""
from __future__ import annotations
from io import BytesIO
from typing import List, Dict, Any

import fitz  # PyMuPDF
from PIL import Image

MAX_DIMENSION = 1024  # Cap image size strictly to prevent OOM
RENDER_DPI = 72  # Standard PDF DPI, extremely memory efficient


def file_to_page_images(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return _pdf_to_images(file_bytes)
    return [_normalize_image_to_dict(Image.open(BytesIO(file_bytes)))]


def _pdf_to_images(file_bytes: bytes) -> List[Dict[str, Any]]:
    images: List[Dict[str, Any]] = []
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        zoom = RENDER_DPI / 72
        matrix = fitz.Matrix(zoom, zoom)
        for page in doc:
            pix = page.get_pixmap(matrix=matrix)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            images.append(_normalize_image_to_dict(img))
    finally:
        doc.close()
    return images


def _normalize_image_to_dict(img: Image.Image) -> Dict[str, Any]:
    img = img.convert("RGB")
    if max(img.size) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(img.size)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return {
        "bytes": buf.getvalue(),
        "width": img.width,
        "height": img.height,
        "mime_type": "image/jpeg"
    }


def count_pages(file_bytes: bytes, filename: str) -> int:
    if filename.lower().endswith(".pdf"):
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            return doc.page_count
        finally:
            doc.close()
    return 1
