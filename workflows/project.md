# Project

Require a non-blank `list` and an exact item ID before running the command.
Stop with an input error if either is missing; do not infer them.

From the directory containing this workflow file, run with the supplied
`list` and exact item ID:

```sh
node ../commands/resolve-local-project-directory.ts "<list>" "<item ID>"
```

Return the command's output unchanged. If it fails, report the error.
