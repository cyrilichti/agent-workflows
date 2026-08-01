# GitLab Provider

## resolve-repository

Accept the GitLab project path or URL derived by the caller from the current
push remote. Return the URL-encoded namespace and project path expected by the
GitLab MCP as the repository identity. Stop when the path is empty or does not
identify a project; do not contact GitLab to infer it.

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
branch as `target_branch`, author, and URL.

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
