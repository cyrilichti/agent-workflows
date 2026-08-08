# create-request

Require writable `create_pull_request`; otherwise stop without substitution.

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

Send no body, reviewers, or maintainer settings. Normalize:

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

Native draft behavior depends on `draft: true`, not the `Draft:` prefix.
