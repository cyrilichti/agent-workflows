# apply-item-label

Apply the supplied label as a ClickUp tag:

```text
tool: clickup_add_tag_to_task
arguments:
  task_id: item ID
  tag_name: supplied label
```

Return `applied: true` when it succeeds, `applied: false` with
`reason: label_missing` when the tag does not exist, and `applied: false` with
`reason: provider_failure` on any other failure.
