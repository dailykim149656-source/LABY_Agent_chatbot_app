from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Iterable, List, Optional

from sqlalchemy import bindparam, text


@dataclass(frozen=True)
class TranslationCacheRow:
    source_hash: str
    source_lang: Optional[str]
    target_lang: str
    provider: str
    translated_text: str
    expires_at: Optional[datetime]


def get_cached_many(
    engine,
    source_hashes: Iterable[str],
    target_lang: str,
    source_lang: Optional[str],
    provider: str,
) -> Dict[str, str]:
    hashes = [h for h in source_hashes if h]
    if not hashes:
        return {}

    sql = text(
        """
        SELECT source_hash, translated_text
        FROM TranslationCache
        WHERE source_hash IN :hashes
          AND target_lang = :target_lang
          AND provider = :provider
          AND (
            (:source_lang IS NULL AND source_lang IS NULL)
            OR source_lang = :source_lang
          )
          AND (expires_at IS NULL OR expires_at > GETUTCDATE())
        """
    ).bindparams(bindparam("hashes", expanding=True))

    with engine.connect() as conn:
        rows = conn.execute(
            sql,
            {
                "hashes": hashes,
                "target_lang": target_lang,
                "source_lang": source_lang,
                "provider": provider,
            },
        ).mappings().all()

        if rows:
            touch_sql = text(
                """
                UPDATE TranslationCache
                SET last_accessed_at = GETUTCDATE(),
                    hit_count = hit_count + 1
                WHERE source_hash IN :hashes
                  AND target_lang = :target_lang
                  AND provider = :provider
                  AND (
                    (:source_lang IS NULL AND source_lang IS NULL)
                    OR source_lang = :source_lang
                  )
                """
            ).bindparams(bindparam("hashes", expanding=True))
            conn.execute(
                touch_sql,
                {
                    "hashes": hashes,
                    "target_lang": target_lang,
                    "source_lang": source_lang,
                    "provider": provider,
                },
            )
            conn.commit()

    return {row["source_hash"]: row["translated_text"] for row in rows}


def upsert_many(engine, rows: List[TranslationCacheRow]) -> None:
    if not rows:
        return

    merge_sql = text(
        """
        MERGE TranslationCache AS target
        USING (
            SELECT
                :source_hash AS source_hash,
                :source_lang AS source_lang,
                :target_lang AS target_lang,
                :provider AS provider
        ) AS source
        ON target.source_hash = source.source_hash
           AND (
                (target.source_lang = source.source_lang)
                OR (target.source_lang IS NULL AND source.source_lang IS NULL)
           )
           AND target.target_lang = source.target_lang
           AND target.provider = source.provider
        WHEN MATCHED THEN
            UPDATE SET
                translated_text = :translated_text,
                last_accessed_at = GETUTCDATE(),
                hit_count = target.hit_count + 1,
                expires_at = :expires_at
        WHEN NOT MATCHED THEN
            INSERT (
                source_hash,
                source_lang,
                target_lang,
                provider,
                translated_text,
                expires_at
            )
            VALUES (
                :source_hash,
                :source_lang,
                :target_lang,
                :provider,
                :translated_text,
                :expires_at
            );
        """
    )

    with engine.begin() as conn:
        for row in rows:
            conn.execute(
                merge_sql,
                {
                    "source_hash": row.source_hash,
                    "source_lang": row.source_lang,
                    "target_lang": row.target_lang,
                    "provider": row.provider,
                    "translated_text": row.translated_text,
                    "expires_at": row.expires_at,
                },
            )
