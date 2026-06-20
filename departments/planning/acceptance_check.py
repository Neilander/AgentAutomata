"""Acceptance-check helpers for generated content."""


def build_acceptance_checklist(output_type: str) -> list[str]:
    """Return a starter checklist for output review."""
    return [
        f"{output_type} matches the project brief",
        "result is complete enough for intended use",
        "known limitations are recorded",
        "API usage and cost are logged",
        "reusable functions are preserved outside the project folder",
    ]

