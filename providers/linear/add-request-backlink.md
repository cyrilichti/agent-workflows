# add-request-backlink

```text
linear issue comment add <item ID or identifier> --body-file - --yes --no-input
```

Pass the exact caller-provided backlink comment on standard input. Require a
successful exit status.

Create only the comment. Do not update issue state or any other issue field.
Use this operation only after creating a new request and never during resumed
work.
