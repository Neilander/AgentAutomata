"""Registry for AI modules used by automation workflows."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ModuleKind = Literal["image", "llm", "code", "stats", "manual"]


@dataclass(frozen=True)
class AiModule:
    """Description of one pluggable AI or automation capability."""

    key: str
    name: str
    kind: ModuleKind
    status: str
    env_keys: tuple[str, ...]
    notes: str


AI_MODULES: tuple[AiModule, ...] = (
    AiModule(
        key="openai_image",
        name="OpenAI GPT Image",
        kind="image",
        status="ready",
        env_keys=("OPENAI_API_KEY", "OPENAI_IMAGE_MODEL"),
        notes="Primary image generation and reference-image editing provider.",
    ),
    AiModule(
        key="gemini_image",
        name="Gemini Image",
        kind="image",
        status="planned",
        env_keys=("GEMINI_API_KEY", "GEMINI_IMAGE_MODEL"),
        notes="Secondary image provider; useful for comparison once configured.",
    ),
    AiModule(
        key="leonardo_image",
        name="Leonardo.ai",
        kind="image",
        status="optional",
        env_keys=("LEONARDO_API_KEY", "LEONARDO_MODEL_ID"),
        notes="Optional REST image provider for asset batches if the account/API plan supports it.",
    ),
    AiModule(
        key="midjourney_manual",
        name="MidJourney Manual Import",
        kind="manual",
        status="manual",
        env_keys=(),
        notes="No official stable API is assumed; import external outputs and metadata instead.",
    ),
    AiModule(
        key="openai_llm",
        name="OpenAI Text/Reasoning",
        kind="llm",
        status="ready",
        env_keys=("OPENAI_API_KEY", "OPENAI_TEXT_MODEL"),
        notes="General planning, prompt expansion, summaries, and code generation.",
    ),
    AiModule(
        key="anthropic_llm",
        name="Anthropic Claude",
        kind="llm",
        status="optional",
        env_keys=("ANTHROPIC_API_KEY", "ANTHROPIC_TEXT_MODEL"),
        notes="Optional second LLM for planning and implementation comparison.",
    ),
    AiModule(
        key="unity_code",
        name="Unity/C# File Writer",
        kind="code",
        status="planned",
        env_keys=(),
        notes="Local file automation target, not a remote AI provider.",
    ),
    AiModule(
        key="stats_balance",
        name="Stats Balance Analyzer",
        kind="stats",
        status="planned",
        env_keys=(),
        notes="CSV/JSON analysis, simulation summaries, and balance recommendations.",
    ),
)


def list_modules(kind: ModuleKind | None = None) -> list[dict[str, object]]:
    """Return module metadata for UI or automation scripts."""
    modules = AI_MODULES if kind is None else tuple(item for item in AI_MODULES if item.kind == kind)
    return [
        {
            "key": item.key,
            "name": item.name,
            "kind": item.kind,
            "status": item.status,
            "env_keys": list(item.env_keys),
            "notes": item.notes,
        }
        for item in modules
    ]

