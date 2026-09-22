# Pick

## Purpose

Resolve and summarize one official item, create a plan via `/plan`, offer
`/refine` on `needs-refinement`, or after plan approval move the item to
in progress and continue with `/work`.

---

## Required Context

Load `../goals/pick-complete.md` once as this workflow's completion contract.

Follow `../rules/user-facing-output.md`.

Follow `../rules/mutation-response.md`.

---

## Steps

### 1. Resolve Context Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

### 2. Resolve Item

Preserve a supplied exact provider ID or native item URL as `reference`.
Preserve any supplied approximate title as `query`. Run
`../commands/resolve-existing-item.md` once as the only item-resolution path:

```text
provider: resolved item provider
reference: supplied exact provider ID or native URL, when available
query: supplied approximate title, when available
candidate_criteria:
  status: open
  label: agent-shaped
fields: labels
```

Require the final official item to contain the exact `agent-shaped` label.
Otherwise, identify the item, report that it is not ready for `/pick`, and stop.

### 3. Summarize Item

Use the returned item and provider ID as the complete official item context.

Present with `../templates/ticket-summary.md`:

```text
item: complete official item context
```

### 4. Create Plan

Resolve the exact `in progress` status before the final plan confirmation:

```text
provider: resolved item provider
item_id: resolved item ID
target_status: in progress
mode: resolve
```

Keep the returned `resolved_target_status` for Step 5.

Follow `./plan.md` with:

```text
item: complete official item context
```

On an approved plan, continue to Step 5.

On `needs-refinement`, report the findings and explain that no plan can be
created yet, then ask using
`../templates/select-option.md` with:

```text
question: Do you want to refine this item?
options:
- Refine item
- Stop without changes
```

- `Stop without changes`: stop.
- `Refine item`: follow `./refine.md` in workflow mode with:

  ```text
  provider: resolved item provider
  parent_item: complete official item context
  needs_refinement_findings: exact findings returned by plan
  ```

  Then stop `/pick`.

### 5. Start Item

Run `../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: resolved item ID
target_status: in progress
resolved_target_status: exact status resolved before plan approval
```

Report the updated item status.

### 6. Continue with Work

Follow `./work.md` in caller mode with:

```text
plan: approved plan
item: complete official item context with the observed updated status
```
