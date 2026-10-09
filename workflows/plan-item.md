# Plan Item Branch

## Purpose

Use the supplied official-item planning context, then follow the shared
execution.

---

## Steps

### 1. Complete Official Context

Preserve the supplied resolved item provider and official item context. Do not
resolve them again. Before assessment, require the official core fields,
including acceptance criteria present in the item content, current labels,
complete comments, and supported linked resources and attachments.

Preserve supplied fields and known empty results. Run
`../commands/read-item.md` with the resolved provider, official item ID, and
only the missing fields, then add only those fields to the official context.
Mark unsupported information explicitly as unavailable. Stop when supported
required information cannot be read.

### 2. Follow Shared Execution

Follow `./plan-confirm.md` with:

```text
task_context: official item context plus supplied planning context
entry_mode: supplied entry mode
```

On `needs-refinement`, return the exact findings and completed official item
context to the caller without publishing a plan or applying a label. Otherwise,
continue only with an approved plan.

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
labels and return that updated item context with the approved plan.
