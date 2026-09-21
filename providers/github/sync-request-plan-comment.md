# sync-request-plan-comment

Use the authenticated GitHub CLI because the configured GitHub MCP operations
do not support editing an existing issue comment.

For `create`:

```text
command: gh
arguments:
  - api
  - --hostname
  - caller repository host
  - --method
  - POST
  - --raw-field
  - body=caller exact body
  - repos/<caller owner>/<caller repo>/issues/<caller request ID>/comments
```

For `update`, use the same command with method `PATCH` and endpoint
`repos/<caller owner>/<caller repo>/issues/comments/<caller comment ID>`.

Parse and return the comment ID and body. Pass every value as a separate
process argument. Do not invoke a shell, retry, or change another request
field.
