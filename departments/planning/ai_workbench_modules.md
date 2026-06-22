# AI Workbench Modules

This document summarizes how the game-dev instruction set maps into reusable automation modules.

## Current Module Map

| Draft concept | Implementation entry point | Notes |
| :--- | :--- | :--- |
| Leonardo.ai art generation | `shared.image_client.create_image(provider="leonardo")` | Optional provider. The first call creates a generation request; polling/downloading can be layered on once account behavior is verified. |
| GPT Image / Gemini image | `shared.image_client.create_image(provider="openai")` or `provider="gemini"` | Preferred direct providers for local art automation and style experiments. |
| MidJourney | `shared.image_client.create_image(provider="manual")` | Keep as manual import unless an official API becomes available. |
| Claude / GPT planning | `shared.llm_client.create_text_response(...)` | Use for GDD drafts, prompt expansion, review summaries, and code generation plans. |
| Unity/C# code writing | Planned local file workflow | Treat as file automation, not a remote provider. Require path-scoped writes and review for large architecture changes. |
| Stats balance analyzer | Planned stats workflow | Read CSV/JSON simulation data, propose changes, then patch data/config files. |

## Automation Contract

Every provider-facing call should include `project` and `task` where possible:

```python
from shared.image_client import create_image

result = create_image(
    "dark western fantasy ring icon, ornate silver, red curse glow",
    provider="openai",
    project="western_fantasy_continent",
    task="ring_icon_style_batch",
    output_dir="projects/western_fantasy_continent/outputs/art/rings",
)
```

This keeps provider usage visible in `logs/api_calls.jsonl`, which is the foundation for later cost reports and automation reliability checks.
