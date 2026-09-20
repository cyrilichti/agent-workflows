# merge-request

Support these merge methods:

```text
merge: no strategy flag
squash: --squash
rebase: --rebase
```

In `resolve` mode, return `supported` for those methods and `unsupported` for
any other method without executing a command.

In `apply` mode, first read the request once with `glab api --hostname <host>
projects/<encoded_path>/merge_requests/<iid>` and require an open request with
an exact head SHA. Then run:

```text
command: glab
arguments:
  - mr
  - merge
  - caller request ID
  - --repo
  - caller repository URL
  - caller merge-method strategy flag, when required
  - --sha
  - observed head SHA
  - --auto-merge=false
  - --yes
```

Return the command exit, stdout, and stderr for caller normalization. Preserve
GitLab's concise reason when the merge is blocked. Pass every value as a
separate process argument; do not invoke a shell, queue auto-merge, retry, or
fall back to another transport. The caller owns the resulting-state read.
