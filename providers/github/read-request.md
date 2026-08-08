# read-request

```text
tool: pull_request_read
arguments:
  method: get
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
```

Map the number to `request_id`, set `kind: pull_request`, normalize merged and
closed states, and return native draft state, head and base branches, author,
HTML URL, and body normalized to an empty string.

For `delivery_state`, also return the exact head SHA and normalize the native
mergeability fields to `merge_status: mergeable`, `blocked`, `unknown`, or
`merged`. Preserve the provider's concise blocker reason when available.

For diffs, use `method: get_diff`. For changed files, use `method: get_files`
and paginate only as required. Keep the same repository and request arguments.

For `review_activity`, exhaust `get_review_comments`, `get_reviews`, and
`get_comments`. Return their complete threads, replies, comments, and verdicts.

For `review_snapshot`, also return the head SHA, untruncated `get_diff` result,
and every paginated `get_files` result with its anchor data. Read the pull
request again and require the same head SHA before returning the snapshot.
Stop when any required collection is partial, filtered, or truncated.
