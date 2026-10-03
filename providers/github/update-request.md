# update-request

Keep the exact host, repository, and request number throughout.

For `replace-description`, send only the caller's exact replacement body:

```text
gh api --hostname <host> --method PATCH --input - repos/<owner>/<repo>/pulls/<number>
stdin JSON: {"body":"<caller exact replacement body>"}
```

For `mark-ready`, update the title only when the caller supplies the current title without its leading `Draft:`:

```text
gh api --hostname <host> --method PATCH --input - repos/<owner>/<repo>/pulls/<number>
stdin JSON: {"title":"<caller title>"}
```

Then mark the request ready; without a title, run only this command:

```text
gh pr ready <number> --repo <host>/<owner>/<repo>
```

Stop on failure or ambiguity, including before `gh pr ready` if the title update is uncertain. Return each attempted command's exit, stdout, stderr, and returned identity. The caller reads the postcondition. Do not change other fields, combine actions, or retry.
