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
from typing import List, Optional, Dict, Any


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
                       images: Optional[List[Dict[str, Any]]] = None) -> dict:
        raise NotImplementedError


class GeminiProvider(AIProvider):
    def __init__(self):
        import google.generativeai as genai
        import threading
        self.lock = threading.Lock()
        
        # Load multiple keys if provided, else fallback to single key
        keys_str = os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", ""))
        self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        if not self.keys:
            raise ValueError("No Gemini API keys found. Set GEMINI_API_KEYS in .env")
            
        self.current_key_idx = 0
        self._genai = genai
        self._model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
        
        # Configure with the first key initially
        self._configure_current_key()

    def _configure_current_key(self):
        with self.lock:
            self._genai.configure(api_key=self.keys[self.current_key_idx])
            self._model = self._genai.GenerativeModel(
                self._model_name,
                generation_config={"response_mime_type": "application/json"},
            )

    def generate_json(self, system_prompt: str, user_prompt: str,
                       images: Optional[List[Dict[str, Any]]] = None) -> dict:
        import time
        from google.api_core.exceptions import ResourceExhausted
        
        parts = [system_prompt + "\n\n" + user_prompt]
        for img in images or []:
            parts.append({"mime_type": img["mime_type"], "data": img["bytes"]})
            
        retry_504 = 0
        keys_tried = 0
        
        while keys_tried < len(self.keys):
            try:
                response = self._model.generate_content(parts)
                return _extract_json(response.text)
            except Exception as e:
                error_str = str(e)
                # Catch 429 Resource Exhausted (Quota/Rate Limit)
                if "429" in error_str or "ResourceExhausted" in error_str:
                    print(f"[WARN] API Key at index {self.current_key_idx} exhausted (429). Rotating...")
                    self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)
                    self._configure_current_key()
                    keys_tried += 1
                    time.sleep(2)
                    continue
                # Catch 504 Deadline Exceeded (Google servers overloaded)
                elif "504" in error_str or "Deadline" in error_str:
                    retry_504 += 1
                    if retry_504 > 3:
                        raise Exception("Google API repeatedly timed out (504 Deadline Exceeded). Their servers are too busy. Please try again later.")
                    print(f"[WARN] API 504 Timeout. Retrying ({retry_504}/3)...")
                    time.sleep(2)
                    continue
                    
                raise e # For all other errors, bubble up to main.py
        
        raise Exception("API Rate Limit Exceeded (429). All AI keys are currently exhausted. Please wait a moment and try again.")


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
                       images: Optional[List[Dict[str, Any]]] = None) -> dict:
        content = [{"type": "text", "text": user_prompt}]
        for img in images or []:
            b64 = base64.b64encode(img["bytes"]).decode()
            mime = img["mime_type"]
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
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
