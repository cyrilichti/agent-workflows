# Done Context

Compact caller packet for `/done`.

## Format

```text
item:
  provider: <resolved item provider>
  item_id: <official provider item ID>
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

- Project only these fields from official records. Never carry review content.
- Keep provider-native identities unchanged.
- Only `merge_blocker` is optional; fail incomplete context.
