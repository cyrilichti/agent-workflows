# Plan Item

## Input

| Input | Requirement |
| --- | --- |
| `provider` | Resolved item provider |
| `item` | Official item ID, core fields, labels, complete comments, and supported linked resources and attachments |
| `entry_mode` | `workflow` or `standalone` |

The item content includes its acceptance criteria when present. Preserve
supplied fields and known empty results. Read only missing required fields
with `../commands/read-item.md`; mark unsupported optional fields unavailable.
Stop when a supported required field cannot be read.

## Steps

1. Follow `./plan-confirm.md` with the complete `item` as `task_context` and
   the supplied `entry_mode`. On `needs-refinement`, return its exact findings
   and unchanged official item context.
2. For an approved plan, publish its exact authoritative file content with
   `../commands/publish-item-plan.md`, passing `provider`, `item_id`, and
   `plan_content`. Require `published: true`; stop on failure.
3. Apply `agent-planned` with `../commands/apply-item-label.md`, passing
   `provider`, `item_id`, and `label`. Require `applied: true`; then return the
   approved plan with the updated item labels.
