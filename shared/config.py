"""Runtime configuration helpers."""

from pathlib import Path


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
        values[key.strip()] = value.strip()
    return values

