"""Reusable medieval character concept helpers."""


def build_medieval_character_prompt(
    role: str,
    era: str = "late medieval",
    mood: str = "grounded cinematic realism",
    visual_notes: str = "",
) -> str:
    """Build a reusable prompt for medieval character concept art."""
    notes = f" Additional visual notes: {visual_notes}" if visual_notes else ""
    return (
        f"{era} {role} character concept art, {mood}, layered clothing, "
        f"clear silhouette, production-ready design sheet.{notes}"
    )


def generate_medieval_character_spec(
    role: str,
    era: str = "late medieval",
    mood: str = "grounded cinematic realism",
    visual_notes: str = "",
) -> dict:
    """Return a structured spec that an image workflow can render later."""
    return {
        "type": "character_concept",
        "theme": "medieval",
        "role": role,
        "era": era,
        "mood": mood,
        "visual_notes": visual_notes,
        "prompt": build_medieval_character_prompt(role, era, mood, visual_notes),
    }

