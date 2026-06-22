"""Tracked image generation client wrappers."""

from __future__ import annotations

import base64
import json
import mimetypes
import uuid
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Literal

from departments.stats.api_call_logger import log_api_call
from shared.config import get_config_value, require_config_value


ImageProvider = Literal["openai", "gemini", "leonardo", "manual", "placeholder"]


def create_image(
    prompt: str,
    provider: ImageProvider = "placeholder",
    model: str | None = None,
    count: int = 1,
    project: str | None = None,
    task: str | None = None,
    reference_image: str | Path | None = None,
    output_dir: str | Path | None = None,
    **options: Any,
) -> dict[str, Any]:
    """Generate or register images through a tracked provider."""
    if provider == "placeholder":
        result = _placeholder_image(prompt, model or "placeholder", count)
    elif provider == "manual":
        result = _manual_image(prompt, model or "manual", reference_image, output_dir)
    elif provider == "openai":
        result = _openai_image(prompt, model, count, reference_image, output_dir, options)
    elif provider == "gemini":
        result = _gemini_image(prompt, model, count, reference_image, output_dir, options)
    elif provider == "leonardo":
        result = _leonardo_image(prompt, model, count, output_dir, options)
    else:
        raise ValueError(f"Unsupported image provider: {provider}")

    log_api_call(
        {
            "provider": provider,
            "department": "art",
            "project": project,
            "task": task,
            "model": result.get("model"),
            "image_count": len(result.get("images", [])),
            "usage": result.get("usage", {}),
        }
    )
    return result


def _placeholder_image(prompt: str, model: str, count: int) -> dict[str, Any]:
    return {
        "provider": "placeholder",
        "model": model,
        "prompt": prompt,
        "images": [],
        "usage": {"units": count},
    }


def _manual_image(
    prompt: str,
    model: str,
    reference_image: str | Path | None,
    output_dir: str | Path | None,
) -> dict[str, Any]:
    images = [str(reference_image)] if reference_image else []
    return {
        "provider": "manual",
        "model": model,
        "prompt": prompt,
        "images": images,
        "output_dir": str(output_dir) if output_dir else None,
        "usage": {"units": 0},
    }


def _openai_image(
    prompt: str,
    model: str | None,
    count: int,
    reference_image: str | Path | None,
    output_dir: str | Path | None,
    options: dict[str, Any],
) -> dict[str, Any]:
    api_key = require_config_value("OPENAI_API_KEY")
    selected_model = model or get_config_value("OPENAI_IMAGE_MODEL", "gpt-image-2")
    size = options.get("size") or get_config_value("OPENAI_IMAGE_SIZE", "1024x1024")
    if reference_image:
        content_type, body = _multipart_body(
            fields={"model": selected_model, "prompt": prompt, "n": str(count), "size": size},
            files={"image": Path(reference_image)},
        )
        payload = _request_json(
            "https://api.openai.com/v1/images/edits",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": content_type},
            body=body,
        )
    else:
        payload = _request_json(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            body=json.dumps(
                {
                    "model": selected_model,
                    "prompt": prompt,
                    "n": count,
                    "size": size,
                }
            ).encode("utf-8"),
        )
    images = _save_base64_images(
        [item.get("b64_json") or item.get("b64") for item in payload.get("data", [])],
        output_dir,
        "openai",
    )
    return {
        "provider": "openai",
        "model": selected_model,
        "prompt": prompt,
        "images": images,
        "raw": payload,
        "usage": {"units": len(images)},
    }


def _gemini_image(
    prompt: str,
    model: str | None,
    count: int,
    reference_image: str | Path | None,
    output_dir: str | Path | None,
    options: dict[str, Any],
) -> dict[str, Any]:
    api_key = require_config_value("GEMINI_API_KEY")
    selected_model = model or get_config_value("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
    parts: list[dict[str, Any]] = [{"text": prompt}]
    if reference_image:
        parts.append(_gemini_inline_image(reference_image))

    payload = _request_json(
        f"https://generativelanguage.googleapis.com/v1beta/models/{selected_model}:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        body=json.dumps({"contents": [{"parts": parts}], "generationConfig": {"candidateCount": count}}).encode("utf-8"),
    )
    inline_images = []
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                inline_images.append(inline["data"])
    images = _save_base64_images(inline_images, output_dir, "gemini")
    return {
        "provider": "gemini",
        "model": selected_model,
        "prompt": prompt,
        "images": images,
        "raw": payload,
        "usage": {"units": len(images)},
    }


def _leonardo_image(
    prompt: str,
    model: str | None,
    count: int,
    output_dir: str | Path | None,
    options: dict[str, Any],
) -> dict[str, Any]:
    api_key = require_config_value("LEONARDO_API_KEY")
    selected_model = model or get_config_value("LEONARDO_MODEL_ID")
    body = {
        "prompt": prompt,
        "num_images": count,
        **options,
    }
    if selected_model:
        body["modelId"] = selected_model

    payload = _request_json(
        "https://cloud.leonardo.ai/api/rest/v1/generations",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        body=json.dumps(body).encode("utf-8"),
    )
    return {
        "provider": "leonardo",
        "model": selected_model,
        "prompt": prompt,
        "images": [],
        "output_dir": str(output_dir) if output_dir else None,
        "raw": payload,
        "usage": {"units": count},
    }


def _request_json(url: str, headers: dict[str, str], body: bytes) -> dict[str, Any]:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Image provider request failed: {error.code} {detail}") from error


def _image_data_url(path: str | Path) -> str:
    image_path = Path(path)
    suffix = image_path.suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(suffix, "application/octet-stream")
    return f"data:{mime};base64,{base64.b64encode(image_path.read_bytes()).decode('ascii')}"


def _multipart_body(fields: dict[str, str], files: dict[str, Path]) -> tuple[str, bytes]:
    boundary = f"----AgentAutomata{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
                str(value).encode("utf-8"),
                b"\r\n",
            ]
        )
    for name, file_path in files.items():
        mime = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="{name}"; filename="{file_path.name}"\r\n'.encode("utf-8"),
                f"Content-Type: {mime}\r\n\r\n".encode("utf-8"),
                file_path.read_bytes(),
                b"\r\n",
            ]
        )
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return f"multipart/form-data; boundary={boundary}", b"".join(chunks)


def _gemini_inline_image(path: str | Path) -> dict[str, Any]:
    data_url = _image_data_url(path)
    mime, data = data_url.removeprefix("data:").split(";base64,", 1)
    return {"inlineData": {"mimeType": mime, "data": data}}


def _save_base64_images(values: list[str | None], output_dir: str | Path | None, prefix: str) -> list[str]:
    if not output_dir:
        return [value for value in values if value]
    folder = Path(output_dir)
    folder.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    for index, value in enumerate([item for item in values if item], start=1):
        path = folder / f"{prefix}_{index:02d}.png"
        path.write_bytes(base64.b64decode(value))
        saved.append(str(path))
    return saved
