# Work Execute

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

Follow the `work_mode` case.

#### `new`

Run from this file's directory with the project-relative plan path:

```sh
node ../commands/work-new.ts "<item ID>" "<plan name>" "<plan objective>" "<plan path>"
```

On failure, report `stage`, `reason`, and completed identities; stop. On
success, set the carried item's status to `resulting_status` and create or
update `Delivery Context` with the plan path, item, `branch`, and `request`.

#### `resumed`

Pass the item ID, `delivery-context.request.request_id`, and
`delivery-context.branch`. Stop if either context value is missing.

Run from this file's directory:

```sh
node ../commands/work-resume.ts "<item ID>" "<request ID>" "<branch>"
```

On failure, report `stage`, `reason`, and completed identities; stop. On
success, set the carried item's status to `resulting_status` and record the
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

If the command fails, report its `stage` and `reason`, then stop. On success,
clear `source_findings`.

#### Activate the Specialist

When the command returns a `todo`, read the numbered todo list from the current
plan, including any corrective todos just added. Follow `./specialist.md` once
with:

```text
task_context: complete numbered todo list from the current plan
```

#### Execute Each Todo

For each returned `todo`:

1. Implement and validate only that todo, then stage only its changes.
2. Run one command from this file's directory:

   With staged changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>" "<Conventional Commit message>"
   ```

   Without staged changes:

   ```sh
   node ../commands/work-complete-todo.ts "<plan path>" "<todo number>"
   ```

On `todo`, repeat. On `ready` or `cancelled`, go to Step 3. On `failed`, report
the command result and stop.

### 3. Continue to Ready

On `status: cancelled`, report no completed work and stop. On `status: ready`,
follow `./ready.md` in caller mode with:

```text
delivery-context: current complete delivery context
```

