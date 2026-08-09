# Inspect Curation

Present one or more complete findings for grouped explicit decisions.

## Format

```markdown
## Inspect Curation

<every complete current finding in stable order>

Reply with exactly one decision for every finding ID:

- `<ID>: Accept`
- `<ID>: Reject`
- `<ID>: Modify — <requested change>`
```

## Rules

- Show every finding completely and require one decision per ID without
  preselection; `Modify` includes its requested change.
- Preserve valid decisions and ask only for missing or invalid ones.
- Never infer a decision or accept a partial final set.
