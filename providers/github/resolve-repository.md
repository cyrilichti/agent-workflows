# resolve-repository

Accept these push-remote shapes:

```text
https://<host>/<owner>/<repository>.git
https://<host>/<owner>/<repository>
git@<host>:<owner>/<repository>.git
ssh://git@<host>/<owner>/<repository>.git
```

Strip one trailing `.git` suffix. Require a non-empty host and exactly two
decoded path segments: owner and repository. Return:

```text
host: parsed remote host
owner: parsed owner
repo: parsed repository
```

Reject local paths, file URLs, missing owners, nested paths, and ambiguous URL
forms. Do not infer `github.com`; the MCP server configuration remains
authoritative for GitHub.com versus GitHub Enterprise connectivity.

