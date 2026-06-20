"""Placeholder LLM client wrapper.

Real provider calls should be added here so usage can be logged in one place.
"""


def create_text_response(prompt: str, model: str = "placeholder") -> dict:
    """Return a placeholder text response payload."""
    return {
        "model": model,
        "prompt": prompt,
        "content": "",
        "usage": {
            "input_tokens": 0,
            "output_tokens": 0,
        },
    }

