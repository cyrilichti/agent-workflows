# create-item


Serialize the confirmed item sections as Markdown, then create the issue:

```text
tool: save_issue
arguments:
  team: selected destination team
  project: selected destination project, when provided
  title: confirmed title
  description: confirmed free-form Markdown body
```

Omit assignment and state so the caller can handle them separately.
