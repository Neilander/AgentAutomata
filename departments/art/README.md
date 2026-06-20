# Art Department

The art department owns reusable visual generation capabilities.

All useful output logic should be wrapped as functions so it can be reused across future projects. For example, a medieval character exploration should leave behind reusable prompt builders, reference-sheet generators, and rendering workflows rather than one-off scripts.

## Rules

- Put reusable functions in `functions/`.
- Put multi-step processes in `workflows/`.
- Put generated local artifacts in `outputs/`.
- Keep project-specific decisions in `projects/`, not here.

