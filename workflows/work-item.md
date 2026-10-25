# Work Item Branch

## Input


| Input              | Requirement            |
| ------------------ | ---------------------- |
| `work_mode`        | Required               |
| `plan`             | Required for `new`     |
| `item`             | Required for `new`     |
| `delivery-context` | Required for `resumed` |


---

## Steps

### 1. Start or Resume Work

Follow exactly one case according to `work_mode`.

#### `new`

Pass the plan path relative to the project.

Run from this file's directory:

```sh
node ../commands/work-new.ts "<item ID>" "<plan name>" "<plan objective>" "<plan path>"
```

If the command fails, report its `stage`, `reason`, and completed identities,
then stop. Otherwise, set the carried item's status to `resulting_status`,
then create or update `Delivery Context` with the plan path, item, `branch`,
and `request`.



#### `resumed`

Pass the item ID, `delivery-context.request.request_id`, and
`delivery-context.branch`. Stop if either context value is missing.

Run from this file's directory:

```sh
node ../commands/work-resume.ts "<item ID>" "<request ID>" "<branch>"
```

If the command fails, report its `stage`, `reason`, and completed identities,
then stop. Otherwise, set the carried item's status to `resulting_status` and
record the returned `branch` and `request` in `Delivery Context`.



### 2. Execute the Plan

#### Persist Corrective Todos

When the delivery context contains `source_findings`, translate each finding
through `../templates/corrective-todo.md` and append it to the authoritative
plan. Persist the plan before clearing the carried findings. Only `/work`
translates findings into corrective todos.

#### Execute Todos

Treat the state symbols in the plan's numbered `## Steps` as authoritative.
Skip `completed` and `cancelled`, then select the first `in_progress` todo or
mark the first `pending` todo `in_progress`. When neither exists, continue to
the Ready handoff below.

Persist every state transition immediately by changing that step's symbol in
the authoritative plan file according to `../templates/plan.md`. Do not keep
todo state only in execution context.

For each active todo:

1. Require a clean worktree and index before implementation.
2. Reuse the active specialist while it remains appropriate. When none is
   active or the todo requires a different agent cohort, follow
   `./specialist.md` with:

   ```text
   task_context:
     todo: active todo
     constraints: relevant plan constraints
     technical_context: required technical context
   ```

   Let the selected specialist route only Skills whose profile triggers apply,
   or work directly when none apply.
3. Have the specialist implement and validate only that todo, then stage only
   its changes.
4. When the index has no staged tracked change, persist the todo as `completed`
   without a commit and continue.
5. Otherwise, create one non-empty Conventional Commit without trailers and
   without asking for confirmation. After success, persist the todo as
   `completed`. Push each non-empty todo commit normally to the current branch
   upstream, then continue.

#### Continue to Ready

When all todos are `cancelled`, report that no work was completed and stop
without calling `/ready`. Require at least one `completed` todo.

Follow `./ready.md` in caller mode without another choice or confirmation:

```text
plan: authoritative plan
item: complete official item context
request_id: current request ID
delivery_context: current delivery context
```
