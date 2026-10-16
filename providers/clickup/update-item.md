# update-item

```text
clickup-cli task update <item ID> [--name <confirmed title>] [--description <confirmed Markdown body>] --output json
```

Pass only confirmed changed fields as separate arguments, escaping a literal
leading `@` in text as `@@`. Return ID, name, and URL from the single mutation
record when available. Do not change other fields.
