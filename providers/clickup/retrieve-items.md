# retrieve-items

```text
clickup-cli task search --page 0 --output json
```

Add only caller-requested filters: repeat `--status` for resolved names,
`--tag` for an exact label, and `--assignee` for numeric user IDs. For the
current user, resolve `id` from `clickup-cli auth whoami --output json` once.
With a label and no status constraint, add `--include-closed`; for `open`,
omit it. Omit `--subtasks` and do not add unrequested assignee scope.
Percent-encode status/tag query values in this version; use native names for
comparison. Apply remaining criteria locally before the caller's `limit`.
Never request another page.

Normalize `id` to `provider_id`, `name` to `title`, `status.status` to `status`,
and `list.name` to `destination`. Preserve provider order and return only
requested fields, not raw payloads.
