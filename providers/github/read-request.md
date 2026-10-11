# read-request

Read the exact pull request and require its number to match the caller's ID:

```text
gh api --hostname <host> repos/<owner>/<repo>/pulls/<number>
```

Normalize its number to `request_id`, kind to `pull_request`, `merged`/`state` to open, merged, or closed, and null `body` to an empty string. Preserve draft, head/base branches, author, and URL. For `delivery_state`, return exact `head.sha`; map merged to `merged`, `mergeable: false` or a definite blocked state to `blocked`, `mergeable: true` with a definite ready state to `mergeable`, and all other states to `unknown`. Preserve a definite blocker reason. Never infer repository or request identity from the current branch.

For requested commits or files, exhaust the relevant endpoint with `per_page=100`, flatten all pages, and reject partial results or provider limits:

```text
gh api --hostname <host> --paginate --slurp 'repos/<owner>/<repo>/pulls/<number>/commits?per_page=100'
gh api --hostname <host> --paginate --slurp 'repos/<owner>/<repo>/pulls/<number>/files?per_page=100'
```

For requested diffs, require the complete, untruncated response:

```text
gh api --hostname <host> -H 'Accept: application/vnd.github.v3.diff' repos/<owner>/<repo>/pulls/<number>
```

For `review_activity`, exhaust all three endpoints independently. Preserve `in_reply_to_id` relationships, review bodies and verdicts, identities, locations, bodies, and timestamps:

```text
gh api --hostname <host> --paginate --slurp 'repos/<owner>/<repo>/pulls/<number>/comments?per_page=100'
gh api --hostname <host> --paginate --slurp 'repos/<owner>/<repo>/pulls/<number>/reviews?per_page=100'
gh api --hostname <host> --paginate --slurp 'repos/<owner>/<repo>/issues/<number>/comments?per_page=100'
```

For `review_snapshot`, include activity, full diff, and complete changed files. Derive valid inline anchors from paths and patches; reject missing patches needed for anchors or disagreement with the diff. Reread the request and require the same `head.sha`. Stop on stale, malformed, filtered, truncated, or ambiguous data. Do not retry failed reads or substitute search results. Pass arguments separately without a shell.
