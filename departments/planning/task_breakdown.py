"""Task breakdown helpers."""


def create_basic_plan(direction: str) -> dict:
    """Create a minimal structured plan from a user direction."""
    return {
        "direction": direction,
        "steps": [
            "clarify output target",
            "identify reusable functions",
            "execute project workflow",
            "verify output quality",
            "record cost and lessons",
        ],
    }

