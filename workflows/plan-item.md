# Plan Item Branch

## Purpose

Resolve official-item planning context, then follow the shared execution.

---

## Steps

### 1. Resolve Official Context

Require and preserve the official item's exact ID and URL. Stop when either is
missing; never reconstruct them. Use the conversation to complete only a
missing objective, problem, or expected outcome.

### 2. Follow Shared Execution

Follow `./plan-confirm.md` with:

```text
task_context: official item context plus supplied planning context
entry_mode: workflow
```

Keep the approved plan returned by that workflow.

### 3. Publish the Approved Plan

Resolve the configured item provider. Read the exact complete approved plan
from its authoritative file, then run `../commands/publish-item-plan.md` with:

```text
provider: resolved item provider
item_id: official item ID
plan_content: exact complete approved plan content
```

Run `../commands/read-item-plan.md` for the same item and require a returned
`plan_content` before continuing. Then run `../commands/apply-item-label.md`
with:

```text
provider: resolved item provider
item_id: official item ID
label: agent-planned
```

Require `applied: true`. Add `agent-planned` to the preserved official item
labels and return that updated item context with the approved plan. Do not
apply the label when publication or reading fails.
