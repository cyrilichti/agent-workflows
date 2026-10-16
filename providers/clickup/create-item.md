# create-item

```text
clickup-cli task create --list <selected List ID> --name <confirmed title> --description <confirmed Markdown body> --output json
```

Return ID, name, and URL from the single created record in the JSON array.
Pass values as separate process arguments; escape a literal leading `@` in the
body as `@@` because the CLI otherwise treats it as a file reference.
