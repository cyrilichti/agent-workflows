# search-requests

Search open pull requests by title inside one repository:

```text
tool: search_pull_requests
arguments:
  owner: caller repository owner
  repo: caller repository name
  query: caller title combined with "is:pr is:open in:title"
  sort: created
  order: desc
  perPage: 20
```

Search may return partial title matches. Return each candidate as a partial
provider-neutral request record with `request_id`, `kind: pull_request`, title,
normalized state, native draft state when available, and URL. The caller owns
exact title, branch, state, and draft filtering after `read-request`.

Do not paginate unless no exact request can be resolved from the first page.
Keep every query scoped by both `owner` and `repo`.

