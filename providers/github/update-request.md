# update-request

Require the writable `update_pull_request` operation. If it is unavailable,
return the provider error and do not substitute an issue or file update.

For `replace-description`:

```text
tool: update_pull_request
arguments:
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
  body: caller exact replacement body
```

For `mark-ready`:

```text
tool: update_pull_request
arguments:
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
  draft: false
```

Send no omitted optional field. In particular, do not change title, base,
state, reviewers, or maintainer settings, and do not combine description and
draft mutations in one call.

