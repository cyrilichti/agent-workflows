# apply-item-label

Find an active, non-group issue label with the exact supplied name using:

```text
tool: list_issue_labels
arguments:
  name: supplied label
  includeArchived: false
  includeGroups: false
  limit: 250
  cursor: next cursor when present
```

Stop listing when an exact match is found. Otherwise follow every cursor before
concluding that the label does not exist. When no exact match exists, create a
workspace issue label with:

```text
tool: save_issue_label
arguments:
  name: supplied label
```

Apply the resolved or created label without replacing existing labels:

```text
tool: save_issue
arguments:
  id: item ID
  addLabels:
    - resolved label ID
```

Return `applied: true` when the label is applied. Return `applied: false` with
`reason: provider_failure` on lookup, creation, or application failure.
