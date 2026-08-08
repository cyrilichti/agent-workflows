# search-requests

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

