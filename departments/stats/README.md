# Stats Department

The stats department owns usage logging, API cost calculation, and reporting.

Every API call should eventually flow through a tracked client so the system can measure:

- provider
- model
- input tokens
- output tokens
- image count or other billable units
- estimated cost
- project
- department
- task
- timestamp

