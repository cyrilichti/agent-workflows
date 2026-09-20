# update-request

For `replace-description`:

```text
command: glab
arguments:
  - mr
  - update
  - caller request ID
  - --repo
  - caller repository URL
  - --description
  - caller exact replacement body
  - --yes
```

For `mark-ready`:

```text
command: glab
arguments:
  - mr
  - update
  - caller request ID
  - --repo
  - caller repository URL
  - --ready
  - --yes
  - --title
  - caller ready title, only when supplied
```

Send no omitted field and pass every value as a separate process argument. Do
not invoke a shell, open an editor, combine both actions, or change any other
merge-request field. Return the command result without retrying; the caller
owns postcondition observation.
