# update-item

```text
linear issue update <item ID or identifier> --title <confirmed title> --description-file - --no-input
```

Pass the confirmed free-form Markdown body on standard input. Supply only
confirmed fields; omit `--title` or `--description-file` when absent.

Return the issue ID or identifier, title, and URL from the mutation response
when available.
