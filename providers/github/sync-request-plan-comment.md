# sync-request-plan-comment

For `create`:

```text
tool: add_issue_comment
arguments:
  owner: caller repository owner
  repo: caller repository name
  issue_number: caller request ID
  body: caller exact body
```

For `update`:

```text
tool: update_issue_comment
arguments:
  owner: caller repository owner
  repo: caller repository name
  comment_id: caller comment ID
  body: caller exact body
```

Return the provider comment ID and body. Do not add a reaction, change the
request, retry, or substitute another transport.
