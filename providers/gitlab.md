# GitLab Provider

## create-request

Create one draft merge request:

```text
tool: create_merge_request
arguments:
  id: caller project ID or URL-encoded path
  source_branch: caller source branch
  target_branch: caller target branch
  title: caller title beginning with "Draft:"
```

Do not send a description because the available operation does not accept one.
Return the created merge request IID and URL with its title, state, source
branch, and target branch.

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

Search may return partial title matches. Return their IID, title, state, and URL
so the caller can enforce exact matching and read each candidate. Do not
paginate unless the exact merge request cannot be resolved from the first page.

## read-request

```text
tool: get_merge_request
arguments:
  id: caller project ID or URL-encoded path
  merge_request_iid: caller merge request IID
```

Return the merge request IID, title, state, Draft state, source branch, target
branch, author, and URL.

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
