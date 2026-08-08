# create-request

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
body: pull request body, normalized to an empty string when null or absent
url: pull request HTML URL
```

The `Draft:` title follows the shared request-title convention. Native draft
behavior depends on `draft: true`, not on the title prefix.

