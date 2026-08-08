# update-request

Require writable `update_pull_request`; otherwise return the provider error
without substitution.

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

Send no omitted field. Do not change title, base, state, reviewers, or
maintainer settings, or combine both actions.
