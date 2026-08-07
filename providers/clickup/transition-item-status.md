# transition-item-status

Resolve and update a ClickUp task status.

1. Read the task and its available statuses:

   ```text
   tool: clickup_get_task
   arguments:
     task_id: caller item ID
     expand_statuses: true
   ```

   For `in progress`, stop if this read fails. For `review` or `done`, return a
   non-transitioned best-effort result with the provider failure as its reason.

2. Resolve the caller's normalized target by case-insensitive status name and
   ClickUp status type:
   - for `in progress`, prefer an exact `in progress` name or the single
     non-review active-work equivalent;
   - for `review`, keep only statuses whose name clearly identifies review; do
     not substitute an active-work status or create a status;
   - for `done`, return a successful no-op when the current status has a done or
     closed semantic type. Otherwise, keep only available statuses whose type
     or name clearly means done, completed, or closed.
3. For `in progress`, stop when no status matches and ask the user to select
   one when multiple statuses match equally.
4. For `review` or `done`, continue only when exactly one matching status
   exists. For zero or multiple matches, do not mutate and do not ask the user
   to choose.
5. For `done` with `mode: resolve`, return the current status,
   `already_at_target`, and the resolved target without mutation. For
   `mode: apply`, require a caller-supplied resolved target to remain the exact
   selected available status.
6. Update only the task status when the preceding rules selected one status in
   apply mode:

   ```text
   tool: clickup_update_task
   arguments:
     task_id: caller item ID
     status: resolved workspace status name
   ```

7. For `in progress`, return the updated task status and stop on failure.
8. For `review` or `done`, return a best-effort result containing:
   - `transitioned`: `true` only when the update succeeded;
   - `previous_status`: the status read in Step 1 when available;
   - `target_status`: `review` or `done`;
   - `resolved_target_status`: the single matched status when available;
   - `resulting_status`: the updated status when returned or confirmed;
   - `reason`: required when `transitioned` is `false`, including read failure,
     no match, ambiguous matches, or update failure.

For `done`, also return `already_at_target: true` for the successful no-op and
`false` otherwise. Do not let a non-transitioned `review` result block request
promotion or a non-transitioned `done` result hide an already completed merge.

Do not pass name, description, assignees, dates, priority, custom fields, task
type, or any other optional `clickup_update_task` field.
