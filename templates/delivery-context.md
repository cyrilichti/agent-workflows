# Delivery Context

Use for handoffs among `/work`, `/ready`, and `/inspect` after caller input or
standalone selection.

```text
plan: project-relative authoritative plan path
item: complete official item context
branch: exact work branch
request: exact request record, when available
plan_comment: exact plan-comment identity, when available
source_findings: exact corrective findings, when available
```

- Keep identities stable for one delivery run.
- Read current plan content from `plan`; do not carry another authoritative
  copy.
- Recheck mutable provider and Git state at each mutation or snapshot boundary.
- A standalone workflow creates this context after its initial selection. A
  caller handoff must already contain every identity available at its stage.
