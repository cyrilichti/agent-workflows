# Select Next Item: Linear

Use the active Linear MCP connection selected by `mcp.item.provider`.

1. Call `list_issues` with `label: agent-shaped`,
   `includeArchived: false`, `limit: 250`, and fields `id`, `title`, `url`,
   `createdAt`, `status`, `statusType`, and `labels`. Do not pass `project`,
   `team`, `assignee`, or a saved view. Follow `cursor` until `hasNextPage` is
   false. An unavailable or repeated cursor while more pages remain is an
   error.
2. Keep only issues with the exact `agent-shaped` label whose `statusType` is
   neither `completed` nor `canceled` and whose status is not `duplicate`.
   Require `createdAt` and `id` on each candidate. Do not infer eligibility
   from the label filter alone.
3. After the command sorts the candidates, call `get_issue` for each candidate
   in order. Verify its current exact label and open status using the returned
   issue. Return the first verified item's current title, ID, and URL as
   `{name, id, url}`. Continue when an issue became stale. A read failure is an
   error, not a stale result.

No issue mutation or item-specific search is part of this adapter.
