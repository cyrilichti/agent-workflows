# GitLab Provider

## resolve-repository

Parse the caller push remote, remove its host and one trailing `.git` suffix,
then URL-encode the remaining namespace and project path as the repository
identity expected by the GitLab MCP. Preserve every namespace segment. Stop
when the path is empty or does not identify a project; do not contact GitLab to
infer it.

## resolve-request-backlinks

Keep only URLs served by the configured GitLab provider whose decoded project
path exactly matches the resolved repository and whose remaining path is
`/-/merge_requests/<iid>`. Return the unique merge-request IIDs. Ignore foreign
or malformed URLs without following them.

## create-request

Create one draft merge request:

```text
tool: create_merge_request
arguments:
  id: caller repository as a GitLab project ID or URL-encoded path
  source_branch: caller source branch
  target_branch: caller target branch
  title: caller title beginning with "Draft:"
```

Do not send a description because the available operation does not accept one.
Normalize the result as:

```text
request_id: merge request IID
kind: merge_request
title: merge request title
state: open when GitLab returns opened, otherwise closed when applicable
draft: native GitLab Draft state
source_branch: GitLab source branch
target_branch: GitLab target branch
body: GitLab description normalized to an empty string when absent
url: merge request URL
```

## search-requests

Search open merge requests by title inside one project:

```text
tool: gitlab_search
arguments:
  project_id: caller project ID or URL-encoded path
  scope: merge_requests
  search: caller title
  fields:
    - title
  state: opened
  order_by: created_at
  sort: desc
  per_page: 20
```

Search may return partial title matches. Return each candidate as a partial
provider-neutral request record containing `request_id`,
`kind: merge_request`, title, normalized state, Draft state when available,
and URL. This lets the caller enforce exact matching before reading each
candidate. Do not paginate unless the exact merge request cannot be resolved
from the first page.

## read-request

```text
tool: get_merge_request
arguments:
  id: caller project ID or URL-encoded path
  merge_request_iid: caller merge request IID
```

Return the complete provider-neutral request record: map the merge request IID
to `request_id`, set `kind: merge_request`, normalize `opened` to `open`, and
return title, Draft state as `draft`, source branch as `source_branch`, target
branch as `target_branch`, description as `body` normalized to an empty string
when absent, author, and URL.

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

Continue pagination only when the caller needs more commits or diffs than the
first page returns.

For `review_activity`, call `get_merge_request_notes` and follow every `after`
cursor. Return all notes and their discussion IDs. Native verdicts are
unsupported by the verified GitLab MCP.

For `review_snapshot`, also return the merge request head SHA and exhaust
`get_merge_request_diffs` with `page` and `per_page`. Derive the complete
changed-file set and available anchor data from those diffs. Read the merge
request again and require the same head SHA before returning the snapshot.
Stop when diffs or notes are partial or truncated.

## update-request

Description replacement and draft removal are unsupported by the current
verified adapter operations. Return `unsupported` with this exact reason
without calling a similarly named or inferred GitLab operation.

## publish-review

For a request comment, call `create_merge_request_note` with the repository,
merge-request IID, and exact body. Follow every `after` cursor with
`get_merge_request_notes` to verify the comment after the write. If the result
is ambiguous or unobserved, stop without retrying. If either notes operation is
unavailable, return `unsupported`.

Return `unsupported` for inline comments and native verdicts. Do not substitute
REST, CLI, quick actions, or request-level notes for those operations.

## Sources

- Official GitLab MCP tool reference:
  https://docs.gitlab.com/user/model_context_protocol/mcp_server_tools/
