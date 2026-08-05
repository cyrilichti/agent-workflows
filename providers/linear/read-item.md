# read-item


```text
tool: get_issue
arguments:
  id: item ID or identifier
```

Return the issue's title, description, state, team, project, assignee, and URL.

Set `includeRelations: true` when linked resources are requested. When comments
are requested, call `list_comments` with `issueId` set to the same issue ID or
identifier. Attachments are returned by `get_issue`.

For `request_backlinks`, call `list_comments`, follow every returned cursor
until no next page remains, and return every `Draft PR:` or `Draft MR:` URL. If
a comments page fails or is truncated, stop without returning the item.
