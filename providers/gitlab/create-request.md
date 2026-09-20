# create-request

```text
command: glab
arguments:
  - mr
  - create
  - --repo
  - caller repository URL
  - --source-branch
  - caller source branch
  - --target-branch
  - caller target branch
  - --title
  - caller title beginning with "Draft:"
  - --description
  - empty string
  - --draft
  - --yes
```

Require the command to exit successfully and return exactly one merge-request
URL matching the caller repository. Extract its IID, then observe it once with
`glab mr view <iid> --repo <repository URL> --output json`. Stop when creation
fails or the created request cannot be identified or observed; do not retry or
search.

Normalize the observed request:

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

Pass every value as a separate process argument. Do not invoke a shell, open an
editor, push a branch, assign reviewers, or recover with another transport.
