# Done Context

Compact caller packet for `/done`.

## Format

```text
item:
  provider: <resolved item provider>
  id: <official provider item ID>
  title: <official item title>
  status: <observed item status>
  link: <official item link, when available>
request:
  provider: <resolved version provider>
  repository: <resolved repository>
  id: <exact request ID>
  kind: <pull_request or merge_request>
  url: <exact request URL>
  source_branch: <exact source branch>
  target_branch: <exact target branch>
  state: <open or merged>
  draft: false
  head_sha: <exact observed head SHA>
  merge_status: <mergeable, blocked, unknown, or merged>
  merge_blocker: <provider reason, when available>
```

## Rules

- Project only these completion fields from complete official item and request
  records; never carry the review snapshot, findings, activity, diff, or other
  inspection-only content.
- Preserve provider-native repository identity and request ID without
  reformatting them.
- Omit only optional `link` and `merge_blocker`. Treat every other missing
  field as incomplete caller context.
