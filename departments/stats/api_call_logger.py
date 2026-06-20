"""Append-only API call logging helpers."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def log_api_call(record: dict[str, Any], log_path: str | Path = "logs/api_calls.jsonl") -> None:
    """Write one API usage record as JSONL."""
    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **record,
    }
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(payload, ensure_ascii=False) + "\n")

