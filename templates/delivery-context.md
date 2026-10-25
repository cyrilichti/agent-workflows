# Delivery Context

Use for handoffs among `/work`, `/ready`, and `/inspect` after caller input or
standalone selection.

```text
plan: project-relative authoritative plan path
item: complete official item context
branch: exact work branch
request: exact request record, when available
source_findings:
  - workflow: ready or inspect
    id: stable finding ID
    head_sha: exact source HEAD SHA
    finding: exact complete source finding
```
