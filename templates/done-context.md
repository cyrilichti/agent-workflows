# Done Context

Compact caller packet for `/done`.

## Format

```text
item:
  provider: <resolved item provider>
  item_id: <official provider item ID>
  labels: <complete current label set, when available>
  status: <current official status, when available>
  destination: <provider status destination, when available>
request:
  provider: <resolved version provider>
  repository: <resolved repository>
  request_id: <exact request ID>
  source_branch: <exact source branch>
  target_branch: <exact target branch>
  state: <open or merged>
  draft: false
  head_sha: <exact observed head SHA>
  merge_status: <mergeable, blocked, unknown, or merged>
  merge_blocker: <provider reason, when available>
```

## Rules

- Project only these fields from official records. Never carry descriptions,
  comment collections, or review content.
- Keep provider-native identities unchanged.
- `item.provider`, `item.item_id`, and every request field except
  `merge_blocker` are required. `item.labels`, `item.status`, and
  `item.destination` are reusable fields: supply all three together when they
  are available from the current workflow run, or omit them so the completion
  branch reads the official item once.
