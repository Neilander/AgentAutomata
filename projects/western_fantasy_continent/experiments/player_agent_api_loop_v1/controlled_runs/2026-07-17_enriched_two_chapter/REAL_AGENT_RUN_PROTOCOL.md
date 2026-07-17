# Real Agent Run Protocol

You own exactly one player profile. Do not inspect another profile's decisions or summaries.

1. Read the complete project-local player cognition simulation skill and its required references.
2. Use the same subagent for every decision and attribution in both chapters of this profile.
3. At each step run `enriched-two-chapter-cli.js request <session.json> <request.json>` and read the request.
4. If the request type is `decision`, choose only a visible allowed action. Follow the supplied player profile, current knowledge, current emotion, failure memories, character impressions and roster predictions. Do not use code internals or designer intent.
5. Write one valid response JSON and apply it with `... decision <session.json> <response.json>`.
6. Request again. For `attribution`, cite only supplied semantic events and existing knowledge, then apply with `... attribution ...`.
7. For `chapter_transition`, run `... advance <session.json>`.
8. Stop only on `complete`, a code cycle limit, or a genuine inability to choose a valid action. Never force the authored route.
9. Run `... summary <session.json> <summary.json>` at the end and write `agent-notes.md` describing the player's own reasoning, prior corrections, decisive failures and unresolved confusion.

The orchestration interface cannot select or reveal the underlying model. Do not claim that the actual model was `5.5fast`; the manifest records the limitation.
