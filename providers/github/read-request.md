# read-request

Follow `./cli-conventions.md`. Read the exact pull request with `gh api
--hostname <host> repos/<owner>/<repo>/pulls/<number>` and parse its complete
JSON response. Require the returned `number` to equal the caller's request ID.

Map the number to `request_id` and set `kind: pull_request`. Use `merged` and
`state` to normalize `open`, `merged`, and `closed`. Return native `draft`,
head and base branches, author, `html_url`, and `body` normalized to an empty
string when null. Do not infer a repository or request from the current branch.

For `delivery_state`, return the exact `head.sha`. Map `merged: true` to
`merge_status: merged`; `mergeable: false` or a definite blocked
`mergeable_state` to `blocked`; `mergeable: true` with a definite ready state to
`mergeable`; and null, checking, or unrecognized states to `unknown`. Preserve
the native `mergeable_state` as a concise blocker reason when it identifies
one. Never treat an unknown state as mergeable.

For requested commits, list `repos/<owner>/<repo>/pulls/<number>/commits` with
`gh api --hostname <host> --paginate --slurp` and flatten every page. For
changed files, do the same with `repos/<owner>/<repo>/pulls/<number>/files`.
Pass `per_page=100` on list endpoints and require every page and entry to be
complete. Stop if GitHub's file-list limit or any other provider limit makes
the collection partial.

For requested diffs, read `repos/<owner>/<repo>/pulls/<number>` with `gh api
--hostname <host> -H 'Accept: application/vnd.github.v3.diff'`. Require a
complete, untruncated diff; do not substitute a filtered or shortened preview.

For `review_activity`, independently exhaust these three list endpoints with
`gh api --hostname <host> --paginate --slurp` and `per_page=100`:

```text
repos/<owner>/<repo>/pulls/<number>/comments
repos/<owner>/<repo>/pulls/<number>/reviews
repos/<owner>/<repo>/issues/<number>/comments
```

Return every review comment and reply (using `in_reply_to_id` to retain thread
relationships), every review body and verdict, and every issue comment. Keep
provider identities, authors, bodies, locations, and timestamps needed to
reconcile publication. Stop when any response is malformed, partial, filtered,
or truncated.

For `review_snapshot`, include `review_activity`, the full diff, and the
complete changed-file set with valid inline-anchor data derived from its
patches and paths. Require the file set and diff to agree where GitHub supplies
text patches; reject omitted or truncated patches needed for anchors. Read the
pull request again and require the same `head.sha` before returning the
snapshot. Stop on a stale, partial, or ambiguous result.

Do not retry a failed read or replace it with a search result. Pass every
value as a separate process argument and do not invoke a shell.
