# Shared

Shared utilities live here: configuration loading, model clients, image clients, and filesystem helpers.

Department and project code should use shared clients so logging and cost tracking stay consistent.

## AI Module Entry Points

- `shared.ai_modules.list_modules()` returns the current provider/module registry for automation UIs and scripts.
- `shared.image_client.create_image(...)` is the tracked image entry point for OpenAI, Gemini, Leonardo.ai, manual imports, and placeholders.
- `shared.llm_client.create_text_response(...)` is the tracked text entry point for OpenAI, Anthropic, and placeholders.
- Real keys belong in `env/.env` or shell environment variables. Do not commit secrets.

Recommended automation pattern:

1. Use `ai_modules` to choose a provider.
2. Call the matching shared client.
3. Store generated assets in a project folder.
4. Let `departments.stats.api_call_logger` write usage to `logs/api_calls.jsonl`.

The older workbench instruction set is treated as a workflow draft. Provider-specific details should live in clients and module metadata, not in prompts pasted into every task.
