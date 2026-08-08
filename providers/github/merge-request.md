# merge-request

Require writable `merge_pull_request`; otherwise return `unsupported` without
substitution.

```text
tool: merge_pull_request
arguments:
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
  merge_method: caller merge method, when provided
```

Omit `merge_method` when absent. After the attempt, read the same pull request
with `delivery_state` and normalize through `../../commands/merge-request.md`.
Do not retry an ambiguous operation.
