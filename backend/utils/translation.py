import hashlib
from typing import Optional

DEFAULT_SOURCE_LANG = "ko"

LANGUAGE_ALIASES = {
    "KR": "ko",
    "KO": "ko",
    "KOR": "ko",
    "KO-KR": "ko",
    "EN": "en",
    "EN-US": "en",
    "EN-GB": "en",
    "JP": "ja",
    "JA": "ja",
    "JA-JP": "ja",
    "CN": "zh-Hans",
    "ZH": "zh-Hans",
    "ZH-CN": "zh-Hans",
    "ZH-HANS": "zh-Hans",
    "ZH-HANT": "zh-Hant",
    "ZH-TW": "zh-Hant",
}


def normalize_lang_code(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    trimmed = value.strip().replace("_", "-")
    if not trimmed:
        return None
    alias = LANGUAGE_ALIASES.get(trimmed.upper())
    if alias:
        return alias
    lower = trimmed.lower()
    if lower in ("ko", "en", "ja"):
        return lower
    if lower in ("zh", "zh-hans", "zh-cn"):
        return "zh-Hans"
    if lower in ("zh-hant", "zh-tw"):
        return "zh-Hant"
    return None


def parse_accept_language(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    primary = value.split(",")[0].strip()
    return primary or None


def resolve_target_lang(lang_param: Optional[str], accept_language: Optional[str]) -> Optional[str]:
    direct = normalize_lang_code(lang_param)
    if direct:
        return direct
    return normalize_lang_code(parse_accept_language(accept_language))


def normalize_text(text: str) -> str:
    return " ".join(text.split()).strip()


def hash_text(text: str) -> str:
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def should_translate(target_lang: Optional[str], source_lang: Optional[str] = None) -> bool:
    if not target_lang:
        return False
    if source_lang and target_lang == source_lang:
        return False
    if target_lang == DEFAULT_SOURCE_LANG:
        return False
    return True
