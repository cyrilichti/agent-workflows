# read-item

```text
clickup-cli task get <item ID> --markdown --output json
```

Parse the single task in the JSON array and return its core fields, full
`markdown_description` (otherwise `description`), native status/type, hierarchy,
and URL. Preserve empty descriptions. Return assignees only for requested
`assignment`; for `labels`, require every exact tag name from the native
`tags` array. Return requested attachments or linked tasks from the same record.
Normalize `closed` to `true` for a closed status type or a present closed date,
`false` when native status/closed-date data establishes an open task, and
`null` when neither is available.

For comments or `request_backlinks`:

```text
clickup-cli comment list --task <item ID> --output json
```

A full page has 25 records: continue with the last record's raw `date` and `id`
as `--start` and `--start-id` until a short page. Deduplicate IDs and stop on
failure or a non-advancing boundary. Reconstruct full text from `comment[].text`
in order: this CLI truncates `comment_text` even in JSON. Fail when full text
blocks are unavailable. Return requested comments and `Draft PR:`/`Draft MR:`
URLs only.
