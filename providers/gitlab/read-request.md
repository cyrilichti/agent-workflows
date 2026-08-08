# read-request

```text
tool: get_merge_request
arguments:
  id: caller project ID or URL-encoded path
  merge_request_iid: caller merge request IID
```

Map the IID to `request_id`, set `kind: merge_request`, normalize `opened`,
`merged`, and other terminal states, then return title, Draft state, source and
target branches, author, URL, and description normalized to an empty string.

For `delivery_state`, also return the exact head SHA and normalize the native
merge-status fields to `merge_status: mergeable`, `blocked`, `unknown`, or
`merged`. Preserve the provider's concise blocker reason when available.

When commits are requested:

```text
tool: get_merge_request_commits
arguments:
  id: caller project ID or URL-encoded path
  merge_request_iid: caller merge request IID
```

When diffs are requested:

```text
tool: get_merge_request_diffs
arguments:
  id: caller project ID or URL-encoded path
  merge_request_iid: caller merge request IID
```

Paginate only when the caller requires more than the first page.

For `review_activity`, call `get_merge_request_notes` and follow every `after`
cursor. Return all notes and their discussion IDs. Native verdicts are
unsupported by the verified GitLab MCP.

For `review_snapshot`, also return the merge request head SHA and exhaust
`get_merge_request_diffs` with `page` and `per_page`. Derive the complete
changed-file set and available anchor data from those diffs. Read the merge
request again and require the same head SHA before returning the snapshot.
Stop when diffs or notes are partial or truncated.
