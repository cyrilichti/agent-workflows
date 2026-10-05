# Plan Item Branch

## Purpose

Use the supplied official-item planning context, then follow the shared
execution.

---

## Steps

### 1. Preserve Official Context

Require and preserve the supplied resolved item provider and the official
item's exact ID and URL. Stop when any is missing; never resolve or reconstruct
them. Use the conversation to complete only a missing objective, problem, or
expected outcome.

### 2. Follow Shared Execution

Follow `./plan-confirm.md` with:

```text
task_context: official item context plus supplied planning context
entry_mode: workflow
```

The shared execution returns here only with an approved plan. Continue with
that plan.

### 3. Publish the Approved Plan

Read the exact complete approved plan from its authoritative file, then run
`../commands/publish-item-plan.md` with:

```text
provider: supplied resolved item provider
item_id: official item ID
plan_content: exact complete approved plan content
```

Run `../commands/read-item-plan.md` with the supplied resolved item provider and
the same official item ID, and require a returned `plan_content` before
continuing. Then run `../commands/apply-item-label.md` with:

```text
provider: supplied resolved item provider
item_id: official item ID
label: agent-planned
```

Require `applied: true`. Add `agent-planned` to the preserved official item
labels and return that updated item context with the approved plan. Do not
apply the label when publication or reading fails.
