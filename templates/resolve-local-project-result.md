# Resolve Local Project Result

Return exactly the JSON object produced by
`../commands/resolve-local-project-directory.md`, without a Markdown fence or
surrounding text.

## Found Format

```json
{"path":"<absolute directory path>"}
```

## Unresolved Format

```json
{"status":"<not found|multiple matches|search limit reached|search incomplete|invalid list>"}
```

An unresolved result has no `path`. A command failure is an error, not a JSON
result.
