# read-item

```text
tool: get_issue
arguments:
  id: item ID or identifier
```

Return the issue's title, description, state, native status type, team, project,
and URL. Return its assignee only when `assignment` is requested. When `labels`
are requested, return every current issue label name from the same issue
response as exact labels.

When `eligibility` is requested, return the issue's native `statusType` and set
`closed: true` only when it is `completed` or `canceled`; otherwise set
`closed: false`. Stop when `statusType` is absent.

Set `includeRelations: true` when linked resources are requested. For comments
or `request_backlinks`, call `list_comments` once, follow every cursor, and
return the requested comments and `Draft PR:` or `Draft MR:` URLs. Stop when
the result is incomplete. Attachments are returned by `get_issue`.
