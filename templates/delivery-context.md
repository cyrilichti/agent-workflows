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
- A standalone workflow creates this context only after establishing the
  selected plan and official item association from at least one of: an exact
  `Agent-Workflows-Plan:` comment matching the canonical plan path; the plan's
  exact Ticket ID and URL both matching the official item; or plan content
  read unchanged from the same official item's approved-plan comment during
  the current workflow.
- Inspect every available association reference used by the standalone entry.
  Stop before creating the context when no association is established or when
  a plan backlink, Ticket ID, or Ticket URL contradicts the selected pair.
  Retrieve backlink comment content through the existing official item read
  when it is needed for this check.
- A caller handoff must already contain every identity available at its stage.
  Preserve a complete caller-supplied plan and item pair without rediscovering
  either solely to establish its association again.
