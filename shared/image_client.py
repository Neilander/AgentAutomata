"""Placeholder image client wrapper.

Real image generation calls should be added here so usage can be logged in one place.
"""


def create_image(prompt: str, model: str = "placeholder", count: int = 1) -> dict:
    """Return a placeholder image generation payload."""
    return {
        "model": model,
        "prompt": prompt,
        "count": count,
        "images": [],
        "usage": {
            "units": count,
        },
    }

