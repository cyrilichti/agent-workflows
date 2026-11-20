# Work Execute

## Input


| Input              | Requirement            |
| ------------------ | ---------------------- |
| `work_mode`        | Required               |
| `plan`             | Required for `new`     |
| `item`             | Required for `new`     |
| `delivery-context` | Required for `resumed` |
| `sandbox_context` | Optional, carried unchanged in `delivery-context` |


---

## Steps

### 1. Start or Resume Work

Follow the `work_mode` case.

#### `new`

Run from this file's directory with the project-relative plan path:

```sh
node ../commands/work-new.ts "<item ID>" "<plan name>" "<plan objective>" "<plan path>"
```

On success, set the carried item's status to `resulting_status` and create or
update `Delivery Context` with the plan path, item, `branch`, and `request`.

#### `resumed`

Pass the item ID, `delivery-context.request.request_id`, and
`delivery-context.branch`. Stop if either context value is missing.

Run from this file's directory:

```sh
node ../commands/work-resume.ts "<item ID>" "<request ID>" "<branch>"
```

On success, set the carried item's status to `resulting_status` and record the
returned `branch` and `request` in `Delivery Context`.

### 2. Execute the Plan

#### Select the Next Todo

Add an actionable `todo` to each `source_findings` record. Run from this file's
directory, replacing `[]` with those records as JSON when present:

```sh
node ../commands/work-next-todo.ts "<plan path>" <<'JSON'
[]
JSON
```

On success, clear `source_findings`.

#### Activate the Specialist

When the command returns a `todo`, read the numbered todo list from the current
plan, including any corrective todos just added. Follow `./specialist.md` once
with:

```text
task_context: complete numbered todo list from the current plan
```

#### Execute Each Todo

For each returned `todo`:

1. Implement and validate only that todo.
2. Inspect `git status --short` and remove only untracked temporary files you
   generated for this todo or its validation.
3. Run one command from this file's directory to stage and commit all remaining
   changes before continuing:

   With changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>" "<Conventional Commit message>"
   ```

   Without changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>"
   ```

On `todo`, repeat. On `ready` or `cancelled`, go to Step 3.

### 3. Continue to Ready

On `status: cancelled`, report no completed work and stop. On `status: ready`,
follow `./ready.md` in caller mode with:

```text
delivery-context: current complete delivery context
```

