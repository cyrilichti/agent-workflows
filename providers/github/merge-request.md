# merge-request

Support `merge`, `squash`, and `rebase` through the GitHub pull-request merge
endpoint. In `resolve` mode, return `supported` for these methods and
`unsupported` for another method, without contacting the repository or
mutating anything.

In `apply` mode, read the exact request once with `gh api --hostname <host>
repos/<owner>/<repo>/pulls/<number>`. Require it to be open, unmerged, and to
have an exact `head.sha`. Then run once:

```text
command: gh api
arguments:
  - --hostname
  - caller repository host
  - --method
  - PUT
  - --input
  - -
  - repos/<owner>/<repo>/pulls/<number>/merge
stdin JSON:
  sha: observed head SHA
  merge_method: caller merge method
```

Return the command exit, stdout, and stderr for caller normalization. Preserve
the provider reason when a blocked request is rejected. A successful response
does not establish the final state; the caller reads it. Do not queue
auto-merge, delete the branch, retry an ambiguous merge, or fall back to
another transport.
