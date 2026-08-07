# transition-item-status

Resolve and update a Linear issue status.

1. Read the item to obtain its team:

   ```text
   tool: get_issue
   arguments:
     id: caller item ID or identifier
   ```

2. List the team's available statuses:

   ```text
   tool: list_issue_statuses
   arguments:
     team: item team name or ID
   ```

   For `in progress`, stop if Steps 1 or 2 fail. For `review` or `done`, return
   a non-transitioned best-effort result with the provider failure as its
   reason.

3. Resolve the caller's normalized target by case-insensitive status name and
   Linear status type:
   - for `in progress`, prefer an exact `in progress` name or the single
     non-review active-work equivalent;
   - for `review`, keep only statuses whose name clearly identifies review; do
     not substitute an active-work status or create a status;
   - for `done`, return a successful no-op when the current state type is
     `completed`. Otherwise, keep only available states whose type is
     `completed` or whose name clearly means done or completed.
4. For `in progress`, stop when no status matches and ask the user to select
   one when multiple statuses match equally.
5. For `review` or `done`, continue only when exactly one matching state exists.
   For zero or multiple matches, do not mutate and do not ask the user to
   choose.
6. For `done` with `mode: resolve`, return the current state,
   `already_at_target`, and the resolved target without mutation. For
   `mode: apply`, require a caller-supplied resolved target to remain the exact
   selected available state.
7. Update only the issue state when the preceding rules selected one status in
   apply mode:

   ```text
   tool: save_issue
   arguments:
     id: caller item ID or identifier
     state: resolved workspace status name or ID
   ```
8. For `in progress`, return the updated issue status and stop on failure.
9. For `review` or `done`, return a best-effort result containing:
   - `transitioned`: `true` only when the update succeeded;
   - `previous_status`: the state read in Step 1 when available;
   - `target_status`: `review` or `done`;
   - `resolved_target_status`: the single matched status when available;
   - `resulting_status`: the updated status when returned or confirmed;
   - `reason`: required when `transitioned` is `false`, including read failure,
     no match, ambiguous matches, or update failure.

For `done`, also return `already_at_target: true` for the successful no-op and
`false` otherwise. Do not let a non-transitioned `review` result block request
promotion or a non-transitioned `done` result hide an already completed merge.

Do not pass title, description, team, project, assignee, labels, or any other
optional `save_issue` field.
