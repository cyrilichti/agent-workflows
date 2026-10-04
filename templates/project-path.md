# Project Path

Return exactly one JSON object for the workflow's final result, without a
Markdown fence or surrounding text. Candidate paths from the command stay
internal.

## Found Format

```json
{"path":"<absolute directory path>"}
```

## Unresolved Format

```json
{"status":"<not found|search incomplete>"}
```

An unresolved result has no `path`. A command failure is an error, not a JSON
result.
