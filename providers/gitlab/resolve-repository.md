# resolve-repository

Accept these push-remote shapes:

```text
https://<host>/<namespace>/<repository>.git
https://<host>/<namespace>/<repository>
git@<host>:<namespace>/<repository>.git
ssh://git@<host>/<namespace>/<repository>.git
```

Strip one trailing `.git` suffix and preserve every namespace segment. Require
a non-empty host and at least two decoded path segments. Return:

```text
host: parsed GitLab host
path: decoded namespace and repository path joined by `/`
encoded_path: path URL-encoded as one API path segment
url: https://<host>/<path>
```

Reject local paths, file URLs, query strings, fragments, missing namespaces,
and ambiguous URL forms. Do not contact GitLab or infer a different host or
path.
