# read-request

```text
tool: pull_request_read
arguments:
  method: get
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
```

Return the complete provider-neutral request record: map the pull request
number to `request_id`, set `kind: pull_request`, normalize a merged pull
request to `state: merged` and other closed pull requests to `state: closed`,
and map the native draft state, head branch, base branch, body normalized to an
empty string when null or absent, author, and HTML URL.

For `delivery_state`, also return the exact head SHA and normalize the native
mergeability fields to `merge_status: mergeable`, `blocked`, `unknown`, or
`merged`. Preserve the provider's concise blocker reason when available.

When a diff is requested, call `pull_request_read` with `method: get_diff` and
the same owner, repository, and pull request number. When changed files are
requested, use `method: get_files` and paginate only as required by the caller.

For `review_activity`, exhaust `get_review_comments`, `get_reviews`, and
`get_comments`. Return their complete threads, replies, comments, and verdicts.

For `review_snapshot`, also return the head SHA, untruncated `get_diff` result,
and every paginated `get_files` result with its anchor data. Read the pull
request again and require the same head SHA before returning the snapshot.
Stop when any required collection is partial, filtered, or truncated.

