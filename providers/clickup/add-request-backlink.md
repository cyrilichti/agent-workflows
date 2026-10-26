# add-request-backlink

```text
clickup-cli comment create --task <item ID> --text <exact caller backlink comment> --output json
```

Create only the comment, without `--markdown` or `--notify-all`. Pass its exact
text as one argument, escaping a leading `@` as `@@`. Use only after creating a
new request, never during resumed work. Do not update task fields.
