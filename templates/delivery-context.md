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

- Keep identities stable for one delivery run.
- Read current plan content from `plan`; do not carry another authoritative
  copy.
- Omit `source_findings` when there is no corrective work.
- Recheck mutable provider and Git state at each mutation or snapshot boundary.
- `plan` belongs to `item`.
- A caller handoff must already contain every identity available at its stage.
  Preserve a complete caller-supplied plan and item pair without rediscovering
  either solely to establish its association again.
