# merge-request

In `resolve` mode, return `supported` for `merge`, `squash`, and `rebase`, or `unsupported` for other methods. Make no GitHub call.

In `apply` mode, read the exact pull request once. Require an open, unmerged request with a `head.sha`.

```text
gh api --hostname <host> repos/<owner>/<repo>/pulls/<number>
```

Merge once using the observed SHA and caller method as JSON on standard input:

```text
gh api --hostname <host> --method PUT --input - repos/<owner>/<repo>/pulls/<number>/merge
stdin JSON: {"sha":"<observed head SHA>","merge_method":"<caller method>"}
```

Return exit, stdout, and stderr, including any provider rejection reason. The caller reads the final state. Do not retry an ambiguous merge, queue auto-merge, delete the branch, or change transport.
