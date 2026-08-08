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
  title: caller ready title, only when supplied
```

Send no omitted field. Do not change base, state, reviewers, or maintainer
settings, or combine both actions. For `mark-ready`, change the title only when
the caller supplies the current title with its leading `Draft:` removed.
