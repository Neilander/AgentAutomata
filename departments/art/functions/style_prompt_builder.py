"""Shared prompt-building helpers for visual styles."""


def append_style(prompt: str, style: str, constraints: list[str] | None = None) -> str:
    """Attach a reusable style description and optional constraints to a prompt."""
    constraint_text = ""
    if constraints:
        constraint_text = " Constraints: " + "; ".join(constraints)
    return f"{prompt} Style: {style}.{constraint_text}"

