# Plan Item

## Input

| Input | Requirement |
| --- | --- |
| `provider` | Resolved item provider |
| `item` | Official item ID, core fields, labels, complete comments, and supported linked resources, relations, and attachments |
| `entry_mode` | `workflow` or `standalone` |

The item content includes its acceptance criteria when present. Preserve a
complete supplied item. If a required field is missing, run from this file's
directory with its official ID or identifier:

```sh
node ../commands/resolve-existing-item.ts --with-relations "<item ID or identifier>"
```

Add missing fields from the returned `resolved` item to the supplied context,
preserving its existing fields and provider. On failure, report `stage` and
`reason` and stop.

## Steps

1. Follow `./plan-execute.md` with the complete `item` as `task_context` and
   the supplied `entry_mode`. On `needs-refinement`, return its exact findings
   and unchanged official item context.
2. For an approved plan, publish its exact authoritative file content:

   ```sh
   node ../commands/publish-item-plan.ts <<'JSON'
   {"item_id":"<official item ID>","plan_path":"<canonical plan path>"}
   JSON
   ```

   Require `published: true`; on failure report `stage` and `reason` and stop.
3. Apply `agent-planned` using the same official item ID:

   ```sh
   node ../commands/apply-item-label.ts <<'JSON'
   {"item_id":"<official item ID>","label":"agent-planned"}
   JSON
   ```

   Require `applied: true`; on failure report `stage` and `reason` and stop.
   Add the label to the carried item and return it with the approved plan.
