# GitHub Provider

## resolve-repository

Accept these push-remote shapes:

```text
https://<host>/<owner>/<repository>.git
https://<host>/<owner>/<repository>
git@<host>:<owner>/<repository>.git
ssh://git@<host>/<owner>/<repository>.git
```

Strip one trailing `.git` suffix. Require a non-empty host and exactly two
decoded path segments: owner and repository. Return:

```text
host: parsed remote host
owner: parsed owner
repo: parsed repository
```

Reject local paths, file URLs, missing owners, nested paths, and ambiguous URL
forms. Do not infer `github.com`; the MCP server configuration remains
authoritative for GitHub.com versus GitHub Enterprise connectivity.

## create-request

Create one native draft pull request:

Require a writable `create_pull_request` operation. If the GitHub MCP server is
read-only or the operation is unavailable, stop with the provider error and do
not substitute another operation.

```text
tool: create_pull_request
arguments:
  owner: caller repository owner
  repo: caller repository name
  head: caller source branch
  base: caller target branch
  title: caller title beginning with "Draft:"
  draft: true
```

Do not send a body, reviewers, or maintainer settings. Normalize the result as:

```text
request_id: pull request number
kind: pull_request
title: pull request title
state: open when GitHub returns open, otherwise closed when applicable
draft: native GitHub draft state
source_branch: pull request head branch
target_branch: pull request base branch
url: pull request HTML URL
```

The `Draft:` title follows the shared request-title convention. Native draft
behavior depends on `draft: true`, not on the title prefix.

## search-requests

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

## read-request

```text
tool: pull_request_read
arguments:
  method: get
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
```

Return the complete provider-neutral request record: map the pull request
number to `request_id`, set `kind: pull_request`, normalize its state, and map
the native draft state, head branch, base branch, author, and HTML URL.

When a diff is requested, call `pull_request_read` with `method: get_diff` and
the same owner, repository, and pull request number. When changed files are
requested, use `method: get_files` and paginate only as required by the caller.

## Sources

- Official GitHub MCP Server tool reference:
  https://github.com/github/github-mcp-server
- Official GitHub MCP toolset configuration:
  https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/configure-toolsets
