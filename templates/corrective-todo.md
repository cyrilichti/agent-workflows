# Corrective Todo

Use only in `/work` to translate one `/ready` gap or blocking `/inspect`
finding into persisted plan work.

```yaml
- id: correction-<workflow>-<source-id-slug>
  content: <one-sentence actionable correction>
  status: pending
  source:
    workflow: <ready or inspect>
    id: <source finding ID>
    head_sha: <source HEAD SHA>
    finding: |-
      <exact complete source finding>
```

Append the same `content` to the plan's numbered Steps. Preserve the finding
until this record is persisted. Do not append the same workflow, source ID, and
HEAD SHA twice.
