"""Workflow shell for character concept generation."""

from departments.art.functions.medieval_character import generate_medieval_character_spec


def create_medieval_character_concept(role: str, visual_notes: str = "") -> dict:
    """Create a structured character concept request.

    Rendering is intentionally left to a shared image client so API usage can be
    logged and priced consistently by the stats department.
    """
    return generate_medieval_character_spec(role=role, visual_notes=visual_notes)

