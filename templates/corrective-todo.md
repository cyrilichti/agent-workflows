# Corrective Todo

Use only in `/work` to translate one `/ready` gap or blocking `/inspect`
finding into persisted plan work.

Append a numbered step using the next number and the plan's `○` pending
symbol:

```markdown
<next number>. ○ <one-sentence actionable correction>
   ~~~~yaml
   corrective_source:
     workflow: <ready or inspect>
     id: <source finding ID>
     head_sha: <source HEAD SHA>
     finding: |-
       <exact complete source finding, with each line indented here>
   ~~~~
```

Preserve every source line, including Markdown and HTML markers, within the
block scalar. Choose a fence longer than any matching fence in the finding.
Keep the source block attached to the same step through state changes. Preserve
the finding until the step and source block are persisted. Do not append a
second step with the same `workflow`, `id`, and `head_sha` values.
