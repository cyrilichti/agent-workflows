# update-item

```text
tool: save_issue
arguments:
  id: item ID or identifier
  title: confirmed title, when changed
  description: confirmed free-form Markdown body, when changed
```

Omit every field that the user did not confirm changing. Return the issue ID or
identifier, title, and URL from the mutation response when available.
