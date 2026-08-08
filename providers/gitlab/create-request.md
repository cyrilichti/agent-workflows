# create-request

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
body: GitLab description normalized to an empty string when absent
url: merge request URL
```

