# merge-request

Require the writable `merge_pull_request` operation. If it is unavailable,
return `unsupported` without substituting another operation.

```text
tool: merge_pull_request
arguments:
  owner: caller repository owner
  repo: caller repository name
  pullNumber: caller request ID
  merge_method: caller merge method, when provided
```

Omit `merge_method` when the caller did not select one so repository settings
remain authoritative. After the attempt, read the same pull request with
`delivery_state` and normalize the result through
`../../commands/merge-request.md`. Do not retry an ambiguous operation.
