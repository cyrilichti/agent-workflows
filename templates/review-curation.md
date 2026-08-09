# Review Curation

Present one or more complete findings for grouped explicit decisions.

## Input

- current findings in stable order, each following `./review-finding.md`.

## Format

```markdown
## Review Curation

<every complete current finding in stable order>

Reply with exactly one decision for every finding ID:

- `<ID>: Accept`
- `<ID>: Reject`
- `<ID>: Modify — <requested change>`
```

## Rules

- Show every current finding completely once; do not summarize it.
- Require exactly one decision for every presented ID without preselection.
- `Modify` requires the requested change in the same response.
- Preserve valid decisions when some IDs are missing, duplicated, unknown, or
  invalid; ask only for the unresolved IDs.
- Do not infer a decision from silence or accept a partial final decision set.
