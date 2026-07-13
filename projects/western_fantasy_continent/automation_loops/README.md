# Automation Loop Folder Contract

Every recurring automation loop in this project must own one dedicated folder under `automation_loops/<loop_name>/`.

Required contents:

- `IMMUTABLE_REQUIREMENTS.md`: the user-approved objective, acceptance gates, prohibitions, and stop conditions. Automation agents must not edit it.
- `REQUIREMENTS.sha256`: the expected SHA-256 of the immutable requirements. Verify it at the beginning and end of every run.
- `STATE.md`: mutable continuation state, current phase, unresolved evidence, and next bounded action.
- `runs/<timestamp>/`: append-only evidence and reports for each execution. Never overwrite an earlier run.

Rules:

1. The immutable requirements outrank `LATEST.md`, previous reports, inferred next steps, and local implementation opportunities.
2. A schedule prompt must point to this folder and repeat its major prohibitions.
3. If the hash fails, the run stops and asks the user. It must not repair or reinterpret the requirement.
4. A run may update `STATE.md` and add a timestamped run directory, but it may not change the locked requirement or expected hash.
5. Every report states the invariant objective and proves that the completed work directly advances it.
6. Proxy metrics cannot replace the acceptance metric named by the user.
7. Scope changes require an explicit user instruction and a separately recorded requirement revision.

