"""One interface, two possible providers.

Every AI call in this app goes through `AIProvider.generate_json(...)`.
That's the only thing that needs to change to swap providers - nothing in
pipeline.py or prompts.py knows or cares which one is behind it.

Default is Gemini (reliable free tier, no provisioning gate). If Azure
OpenAI turns out to be usable on your subscription, set AI_PROVIDER=
azure_openai in .env and it uses the same gpt-4o-mini style deployment
you already work with day to day.
"""
from __future__ import annotations
import base64
import json
import os
import re
from io import BytesIO
from typing import List, Optional

from PIL import Image


def _extract_json(text: str) -> dict:
    """Models sometimes wrap JSON in markdown fences or add stray prose.
    Strip that defensively before parsing."""
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    match = re.search(r"\{.*\}|\[.*\]", cleaned, flags=re.DOTALL)
    if match:
        cleaned = match.group(0)
    return json.loads(cleaned)


class AIProvider:
    def generate_json(self, system_prompt: str, user_prompt: str,
                       images: Optional[List[Image.Image]] = None) -> dict:
        raise NotImplementedError


class GeminiProvider(AIProvider):
    def __init__(self):
        import google.generativeai as genai
        api_key = os.environ["GEMINI_API_KEY"]
        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
        self._genai = genai
        self._model = genai.GenerativeModel(
            model_name,
            generation_config={"response_mime_type": "application/json"},
        )

    def generate_json(self, system_prompt: str, user_prompt: str,
                       images: Optional[List[Image.Image]] = None) -> dict:
        parts = [system_prompt + "\n\n" + user_prompt]
        for img in images or []:
            parts.append(img)
        response = self._model.generate_content(parts)
        return _extract_json(response.text)


class AzureOpenAIProvider(AIProvider):
    def __init__(self):
        from openai import AzureOpenAI
        self._client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview"),
        )
        self._deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

    def generate_json(self, system_prompt: str, user_prompt: str,
                       images: Optional[List[Image.Image]] = None) -> dict:
        content = [{"type": "text", "text": user_prompt}]
        for img in images or []:
            buf = BytesIO()
            img.save(buf, format="PNG")
            b64 = base64.b64encode(buf.getvalue()).decode()
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}"},
            })
        response = self._client.chat.completions.create(
            model=self._deployment,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
        )
        return _extract_json(response.choices[0].message.content)


def get_provider() -> AIProvider:
    provider = os.environ.get("AI_PROVIDER", "gemini")
    if provider == "azure_openai":
        return AzureOpenAIProvider()
    return GeminiProvider()
