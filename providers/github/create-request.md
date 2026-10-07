# create-request

Create exactly one draft pull request with:

```text
command: gh
arguments:
  - pr
  - create
  - --repo
  - <caller repository host>/<caller repository owner>/<caller repository repo>
  - --head
  - caller source branch
  - --base
  - caller target branch
  - --title
  - caller title beginning with "Draft:"
  - --body
  - empty string
  - --draft
```

Require a successful exit and exactly one pull-request URL matching the caller
host and repository. Extract its numeric number, then observe it once with:

```text
command: gh
arguments:
  - api
  - --hostname
  - caller repository host
  - repos/<owner>/<repo>/pulls/<number>
```

Require the observed number to match the extracted number, `state: open`,
`draft: true`, and the caller's source and target branches. Stop if creation
fails or the created request cannot be identified or observed; do not search
or retry.

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

Pass every value as a separate process argument. Do not invoke a shell, open an
editor, push or fork a branch, assign reviewers, override maintainer settings,
or recover with another transport.

Native draft behavior depends on `--draft`, not the `Draft:` prefix.
