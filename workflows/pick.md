# Pick

## Purpose

Resolve and summarize one official item, create a plan via `/plan`, offer
`/refine` on `needs-refinement`, or after plan approval move the item to
in progress and hand off to `/work`.

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

When the user supplies a provider item ID, set `resolved item ID` to that ID
and continue at Step 4.

Otherwise run `../commands/retrieve-items.md` with:

```text
provider: resolved item provider
criteria:
  assigned_to: current user
  status: open or ready to start
fields:
  - provider_id
  - title
  - status
limit: 5
```

### 3. Select Item

Ask using `../templates/select-option.md` with:

```text
question: Which item do you want to start?
options:
- label: <title> — <status>
  value: <provider id>
```

Set `resolved item ID` to the selected provider ID.

### 4. Summarize Item

Run `../commands/read-item.md` with:

```text
provider: resolved item provider
item_id: resolved item ID
```

Require the returned item to match the Step 2 assignee and status criteria.

Use the returned item and provider ID as the complete official item context.

Present with `../templates/ticket-summary.md`:

```text
item: complete official item context
```

### 5. Create Plan

Follow `./plan.md` with:

```text
item: complete official item context
```

On an approved plan, continue to Step 6.

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
  parent_item_id: resolved item ID
  parent_item: complete official item context
  needs_refinement_findings: exact findings returned by plan
  ```

  Then stop `/pick`.

### 6. Start Item

Run `../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: resolved item ID
target_status: in progress
```

Report the updated item status.

### 7. Start Work

Follow `./work.md` with:

```text
plan: approved plan
item: complete official item context
```

---

## Safety

- Preserve the complete official item context across `/plan` and `/work`; never
  replace it with pasted or inferred metadata.
- Let `/plan` own planning specialist selection.
