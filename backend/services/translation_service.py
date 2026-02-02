from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import List, Optional

import requests

from ..repositories import translation_cache_repo
from ..repositories.translation_cache_repo import TranslationCacheRow
from ..utils.translation import hash_text, normalize_text, should_translate

logger = logging.getLogger(__name__)


class TranslationService:
    def __init__(self, engine) -> None:
        self.engine = engine
        self.enabled = os.getenv("AZURE_TRANSLATOR_ENABLED", "0") == "1"
        self.endpoint = (os.getenv("AZURE_TRANSLATOR_ENDPOINT") or "").rstrip("/")
        self.key = os.getenv("AZURE_TRANSLATOR_KEY") or ""
        self.region = os.getenv("AZURE_TRANSLATOR_REGION") or ""
        self.timeout = max(float(os.getenv("AZURE_TRANSLATOR_TIMEOUT_MS", "3000")) / 1000.0, 0.5)
        self.max_chars = max(int(os.getenv("AZURE_TRANSLATOR_MAX_CHARS", "10000")), 1000)
        self.max_items = max(int(os.getenv("AZURE_TRANSLATOR_MAX_ITEMS", "50")), 1)
        self.cache_ttl_hours = max(int(os.getenv("AZURE_TRANSLATOR_CACHE_TTL_HOURS", "168")), 1)
        self.provider = "azure_translator"

        if not self.enabled:
            logger.info("Azure Translator is disabled (AZURE_TRANSLATOR_ENABLED != 1)")
            self._session = None
            return

        if not self.endpoint or not self.key:
            logger.warning("Azure Translator enabled but endpoint/key missing. Disabling translator.")
            self.enabled = False
            self._session = None
            return

        logger.info("Azure Translator enabled: endpoint=%s, region=%s", self.endpoint, self.region)
        self._session = requests.Session()

    def translate_texts(
        self,
        texts: List[str],
        target_lang: Optional[str],
        source_lang: Optional[str] = None,
    ) -> List[str]:
        if not texts:
            return []
        if not self.enabled:
            logger.debug("Translation skipped: service disabled")
            return texts
        if not should_translate(target_lang, source_lang):
            logger.debug("Translation skipped: target_lang=%s, source_lang=%s", target_lang, source_lang)
            return texts

        cleaned = []
        for text in texts:
            cleaned.append(text or "")

        indexed = []
        for idx, text in enumerate(cleaned):
            if not text.strip():
                continue
            normalized = normalize_text(text)
            indexed.append((idx, text, normalized, hash_text(normalized)))

        result: List[Optional[str]] = [None] * len(cleaned)
        for idx, text in enumerate(cleaned):
            if not text.strip():
                result[idx] = text

        hashes = [item[3] for item in indexed]
        cached = translation_cache_repo.get_cached_many(
            self.engine,
            hashes,
            target_lang=target_lang or "",
            source_lang=source_lang,
            provider=self.provider,
        )

        missing = []
        for idx, text, normalized, hashed in indexed:
            cached_text = cached.get(hashed)
            if cached_text is not None:
                result[idx] = cached_text
            else:
                missing.append((idx, text, normalized, hashed))

        if missing:
            translations = self._translate_missing(missing, target_lang, source_lang)
            for idx, translated in translations.items():
                result[idx] = translated

        for i, value in enumerate(result):
            if value is None:
                result[i] = cleaned[i]

        return [value or "" for value in result]

    def _translate_missing(
        self,
        missing: List[tuple[int, str, str, str]],
        target_lang: Optional[str],
        source_lang: Optional[str],
    ) -> dict[int, str]:
        output: dict[int, str] = {}
        if not target_lang:
            for idx, text, _, _ in missing:
                output[idx] = text
            return output

        rows_to_cache: List[TranslationCacheRow] = []
        batches: List[List[tuple[int, str, str, str]]] = []
        batch: List[tuple[int, str, str, str]] = []
        batch_chars = 0

        for item in missing:
            text_len = len(item[1])
            if text_len > self.max_chars:
                output[item[0]] = item[1]
                continue
            if batch and (len(batch) >= self.max_items or batch_chars + text_len > self.max_chars):
                batches.append(batch)
                batch = []
                batch_chars = 0
            batch.append(item)
            batch_chars += text_len

        if batch:
            batches.append(batch)

        for batch in batches:
            batch_texts = [item[1] for item in batch]
            translated = self._request_translation(batch_texts, target_lang, source_lang)

            for (idx, text, _normalized, hashed), translated_text in zip(batch, translated):
                final_text = translated_text or text
                output[idx] = final_text
                if translated_text:
                    rows_to_cache.append(
                        TranslationCacheRow(
                            source_hash=hashed,
                            source_lang=source_lang,
                            target_lang=target_lang,
                            provider=self.provider,
                            translated_text=translated_text,
                            expires_at=datetime.utcnow()
                            + timedelta(hours=self.cache_ttl_hours),
                        )
                    )

        if rows_to_cache:
            try:
                translation_cache_repo.upsert_many(self.engine, rows_to_cache)
            except Exception as exc:
                logger.warning("Failed to upsert translation cache: %s", exc)

        return output

    def _request_translation(
        self,
        texts: List[str],
        target_lang: str,
        source_lang: Optional[str],
    ) -> List[str]:
        if not texts:
            return []

        if not self._session:
            return texts

        url = f"{self.endpoint}/translate"
        params = {"api-version": "3.0", "to": target_lang}
        if source_lang:
            params["from"] = source_lang

        headers = {
            "Ocp-Apim-Subscription-Key": self.key,
            "Content-Type": "application/json",
        }
        if self.region:
            headers["Ocp-Apim-Subscription-Region"] = self.region

        payload = [{"Text": text} for text in texts]

        logger.info("Azure Translator request: url=%s, target=%s, texts_count=%d", url, target_lang, len(texts))
        try:
            resp = self._session.post(url, params=params, headers=headers, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            logger.info("Azure Translator response: status=%d, items=%d", resp.status_code, len(data) if isinstance(data, list) else 0)
        except Exception as exc:
            logger.warning("Azure Translator request failed: %s", exc)
            return texts

        results: List[str] = []
        for original, item in zip(texts, data):
            translation = None
            if isinstance(item, dict):
                translations = item.get("translations") or []
                if translations:
                    translation = translations[0].get("text")
            results.append(translation or original)

        return results
