# Select Next Item: ClickUp

Use the active ClickUp MCP connection selected by `mcp.item.provider`.

1. Call `clickup_filter_tasks` with `tags: ["agent-shaped"]`,
   `include_closed: false`, `order_by: created`, and `reverse: true`.
   Do not pass `list_ids`, `folder_ids`, `space_ids`, `assignees`, or a
   workspace ID unless the configured connection requires one to cover its
   intended workspace. Follow `next_page` while `has_more` is true. An absent
   or repeated next page while more pages remain is an error.
2. Keep only tasks with the exact `agent-shaped` tag and an open status. The
   compact filter response omits `date_created`, so read each distinct
   candidate with `clickup_get_task` to obtain its creation timestamp. Do not
   use filter-result order as a substitute for timestamps. A missing timestamp
   or failed read is an error.
3. After the command sorts by `date_created` and ID, use the individual task
   responses to verify the current exact tag and that `date_closed` is null.
   Return the first verified task's current name, ID, and URL as
   `{name, id, url}`. Continue when a task became stale.

If the connection spans multiple ClickUp workspaces and the filter tool cannot
search them together, enumerate each workspace and every page before sorting.
Do not use a mutating ClickUp operation.
