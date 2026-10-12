# Corrective Todo

Use only in `/work` to translate one `/ready` gap or blocking `/inspect`
finding into persisted plan work.

Append a numbered step using the next number and the `pending` prefix from
`../templates/plan.md`:

```markdown
<next number>. [ ] **pending** — <one-sentence actionable correction>
   <!-- corrective-source
   workflow: <ready or inspect>
   id: <source finding ID>
   head_sha: <source HEAD SHA>
   finding: <exact complete source finding>
   -->
```

For a multiline finding, preserve every line inside the comment. Keep the
comment attached to the same step through state changes. Preserve the finding
until the step and comment are persisted. Do not append a second step with the
same `workflow`, `id`, and `head_sha` values.
