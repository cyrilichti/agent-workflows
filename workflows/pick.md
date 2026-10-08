# Pick

## Purpose

Resolve one official item and stop when it is already planned. Otherwise,
summarize it, create a plan via `/plan`, offer `/refine` on
`needs-refinement`, or continue with `/work` after plan approval.

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
  label: agent-shaped
eligibility_criteria:
  status: open
fields: labels
```

When the returned official item is ineligible because it is not open, identify
it, report its observed status and that it cannot continue through `/pick`, and
stop before summarizing or planning.

When the item already contains `agent-planned`, identify it, report that its
plan is already available for `/work`, and stop before summarizing or planning.

Require the remaining item to contain the exact `agent-shaped` label.
Otherwise, identify it, report that it is not ready for `/pick`, and stop.

### 3. Summarize Item

Use the returned item and provider ID as the complete official item context.

Present with `../templates/ticket-summary.md`:

```text
item: complete official item context
```

### 4. Create Plan

Follow `./plan.md` with:

```text
entry_mode: workflow
provider: resolved item provider
item: complete official item context
```

On an approved plan, keep the official item context returned by `/plan` and
continue to Step 5.

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

### 5. Continue with Work

Follow `./work.md` in caller mode with:

```text
plan: approved plan
item: complete official item context returned by /plan
```
