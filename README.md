# AgentAutomata

AgentAutomata is an exploration of autonomous agent production: given a direction, the system should break work down, execute it, preserve reusable capabilities, and produce reliable outputs with measurable cost.

The current target is to build toward an agent workflow where generated content reaches roughly 85% usable reliability with minimal human intervention.

## Structure

- `env/`: local API keys and runtime configuration. Real secrets are ignored by Git.
- `picref/`: local image references and third-party visual material. Files are ignored by Git to avoid accidental copyright exposure.
- `departments/`: reusable department capabilities, organized as callable functions and workflows.
- `projects/`: actual content projects created from user directions.
- `shared/`: common clients, config, and utilities.
- `logs/`: global execution logs.
- `tests/`: focused tests for reusable functions.

## Design Principles

1. Reusable functions first: useful capabilities should live in departments, not be trapped inside one project.
2. Every API call should be measurable: model, usage, cost, project, department, and task should be recorded.
3. Project folders hold briefs, plans, outputs, and logs; they should call reusable department functions.
4. Secrets and copyrighted references stay local.

