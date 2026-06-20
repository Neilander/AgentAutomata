"""Cost calculation helpers for API calls."""

from departments.stats.pricing_config import PRICING


def estimate_text_call_cost(
    provider: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
) -> float:
    """Estimate a text API call cost from configured per-token pricing."""
    model_pricing = PRICING.get(provider, {}).get(model, {})
    input_rate = model_pricing.get("input_per_1m_tokens", 0)
    output_rate = model_pricing.get("output_per_1m_tokens", 0)
    return (input_tokens / 1_000_000 * input_rate) + (
        output_tokens / 1_000_000 * output_rate
    )


def estimate_unit_call_cost(provider: str, model: str, units: int = 1) -> float:
    """Estimate an image or unit-based API call cost."""
    model_pricing = PRICING.get(provider, {}).get(model, {})
    return units * model_pricing.get("unit_price", 0)

