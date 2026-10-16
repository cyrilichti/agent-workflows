# apply-item-label

```text
clickup-cli task add-tag <item ID> <supplied label> --output json
```

Return `applied: true` after successful exit and the JSON success message.
Return `applied: false` with `reason: label_missing` only when the error
identifies a missing tag, otherwise `reason: provider_failure`. Do not create
a tag as a fallback.
