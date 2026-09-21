# sync-request-plan-comment

For `create`:

```text
command: glab
arguments:
  - api
  - --hostname
  - caller repository host
  - --method
  - POST
  - --raw-field
  - body=caller exact body
  - projects/<caller repository encoded_path>/merge_requests/<caller request ID>/notes
```

For `update`, use the same command with method `PUT` and append
`/<caller comment ID>` to the notes endpoint.

Parse and return the note ID and body. Pass every value as a separate process
argument. Do not invoke a shell, retry, or change another request field.
