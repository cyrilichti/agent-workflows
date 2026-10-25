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

#### Select the Next Todo

Add an actionable `todo` to each `source_findings` record. Run from this file's
directory, replacing `[]` with those records as JSON when present:

```sh
node ../commands/work-next-todo.ts "<plan path>" <<'JSON'
[]
JSON
```

If the command fails, report its `stage` and `reason`, then stop. On success,
clear `source_findings`.

#### Execute Each Todo

Follow the returned `todo` until the command returns `ready` or `cancelled`:

1. Reuse the active specialist while appropriate. Otherwise follow
   `./specialist.md` with:

   ```text
   task_context: todo returned by work-next-todo.ts or work-complete-todo.ts
   ```

   Implement and validate only that todo, then stage only its changes.
2. Run one of these commands from this file's directory:

   With staged changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>" "<Conventional Commit message>"
   ```

   Without staged changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>"
   ```

   Repeat from step 1 for each returned todo. Do not ask for commit confirmation
   or add trailers.

   If the command fails, report its `stage`, `reason`, and any completed commit
   or todo, then stop.

### 3. Continue to Ready

When all todos are `cancelled`, report that no work was completed and stop
without calling `/ready`. Require at least one `completed` todo.

Follow `./ready.md` in caller mode without another choice or confirmation:

```text
plan: authoritative plan
item: complete official item context
request_id: current request ID
delivery_context: current delivery context
```
