# create-request

Create exactly one draft pull request with:

```text
command: gh api
arguments:
  - --hostname
  - caller repository host
  - --method
  - POST
  - --input
  - -
  - repos/<owner>/<repo>/pulls
stdin JSON:
  title: caller title beginning with "Draft:"
  head: caller source branch
  base: caller target branch
  draft: true
```

Do not send a body, reviewers, or maintainer settings. Require a successful
exit and exactly one returned pull request with a numeric `number`, native
draft state, and `html_url`. Do not search or retry if creation fails or its
result is ambiguous.

Normalize:

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
