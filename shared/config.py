"""Runtime configuration helpers."""

from __future__ import annotations

from pathlib import Path
from os import environ


ENV_PATH = Path("env/.env")


def load_env_lines(path: Path = ENV_PATH) -> dict[str, str]:
    """Load simple KEY=VALUE lines from the local env file."""
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = _strip_quotes(value.strip())
    return values


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def get_config_value(key: str, default: str | None = None, path: Path = ENV_PATH) -> str | None:
    """Read a value from the process environment, then env/.env."""
    if key in environ:
        return environ[key]
    return load_env_lines(path).get(key, default)


def require_config_value(key: str, path: Path = ENV_PATH) -> str:
    """Read a required configuration value or raise a helpful error."""
    value = get_config_value(key, path=path)
    if not value:
        raise RuntimeError(f"{key} is not configured. Add it to env/.env or the shell environment.")
    return value
