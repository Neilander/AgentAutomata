"""Tracked LLM client wrappers."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Literal

from departments.stats.api_call_logger import log_api_call
from shared.config import get_config_value, require_config_value


LlmProvider = Literal["openai", "anthropic", "placeholder"]


def create_text_response(
    prompt: str,
    provider: LlmProvider = "placeholder",
    model: str | None = None,
    system: str | None = None,
    project: str | None = None,
    task: str | None = None,
    **options: Any,
) -> dict[str, Any]:
    """Create a tracked text response through a configured provider."""
    if provider == "placeholder":
        result = _placeholder_response(prompt, model or "placeholder")
    elif provider == "openai":
        result = _openai_response(prompt, model, system, options)
    elif provider == "anthropic":
        result = _anthropic_response(prompt, model, system, options)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    usage = result.get("usage", {})
    log_api_call(
        {
            "provider": provider,
            "department": "planning",
            "project": project,
            "task": task,
            "model": result.get("model"),
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "usage": usage,
        }
    )
    return result


def _placeholder_response(prompt: str, model: str) -> dict[str, Any]:
    return {
        "provider": "placeholder",
        "model": model,
        "prompt": prompt,
        "content": "",
        "usage": {
            "input_tokens": 0,
            "output_tokens": 0,
        },
    }


def _openai_response(
    prompt: str,
    model: str | None,
    system: str | None,
    options: dict[str, Any],
) -> dict[str, Any]:
    api_key = require_config_value("OPENAI_API_KEY")
    selected_model = model or get_config_value("OPENAI_TEXT_MODEL", "gpt-5-mini")
    input_payload: list[dict[str, str]] = []
    if system:
        input_payload.append({"role": "system", "content": system})
    input_payload.append({"role": "user", "content": prompt})

    payload = _request_json(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        body=json.dumps({"model": selected_model, "input": input_payload, **options}).encode("utf-8"),
    )
    usage = payload.get("usage", {})
    return {
        "provider": "openai",
        "model": selected_model,
        "prompt": prompt,
        "content": _openai_output_text(payload),
        "raw": payload,
        "usage": {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            **usage,
        },
    }


def _anthropic_response(
    prompt: str,
    model: str | None,
    system: str | None,
    options: dict[str, Any],
) -> dict[str, Any]:
    api_key = require_config_value("ANTHROPIC_API_KEY")
    selected_model = model or get_config_value("ANTHROPIC_TEXT_MODEL", "claude-3-5-sonnet-latest")
    payload = _request_json(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        body=json.dumps(
            {
                "model": selected_model,
                "max_tokens": options.pop("max_tokens", 2048),
                "system": system or "",
                "messages": [{"role": "user", "content": prompt}],
                **options,
            }
        ).encode("utf-8"),
    )
    usage = payload.get("usage", {})
    return {
        "provider": "anthropic",
        "model": selected_model,
        "prompt": prompt,
        "content": "".join(item.get("text", "") for item in payload.get("content", []) if item.get("type") == "text"),
        "raw": payload,
        "usage": {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            **usage,
        },
    }


def _request_json(url: str, headers: dict[str, str], body: bytes) -> dict[str, Any]:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM provider request failed: {error.code} {detail}") from error


def _openai_output_text(payload: dict[str, Any]) -> str:
    if payload.get("output_text"):
        return payload["output_text"]
    chunks: list[str] = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(content["text"])
    return "".join(chunks)
