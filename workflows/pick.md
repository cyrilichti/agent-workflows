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
  exclude:
    - assigned to other people
    - in progress
    - done
    - closed
  scope: do not list every item available from the provider
```

### 3. Select Item

Prepare one selectable option per retrieved item.

Attach the provider ID as the internal value. Do not require raw ID selection.

Ask using `../templates/select-option.md` with:

```text
question: Which item do you want to start?
options:
- label: <title> — <status>
  value: <provider id>
```

Do not continue until the selection control or text fallback has been rendered
and the user has selected exactly one item.

Set `resolved item ID` to the selected provider ID.

### 4. Summarize Item

Run `../commands/read-item.md` with:

```text
provider: resolved item provider
item_id: resolved item ID
fields:
  - title
  - description
  - comments
  - acceptance criteria
  - labels
  - linked resources
  - attachments
```

Validate the returned item against the eligibility criteria in Step 2. Stop
when it is not eligible for this workflow.

Set `resolved item ID` to the provider ID returned by `read-item`. Keep the
returned provider item as the complete official item context.

Present it with `../templates/ticket-summary.md`. Do not continue until that
summary has been shown.

### 5. Create Plan

Follow `./plan.md` with:

```text
item: complete official item context, including its provider ID
```

`/plan` uses that provider ID as `planId`.

Continue to Step 6 only when `/plan` returns an approved plan.

On `needs-refinement`, report its concise findings, state that the item must be
refined before an implementation plan can be created, then ask using
`../templates/select-option.md` with:

```text
question: Do you want to refine this item?
options:
- Refine item
- Stop without changes
```

- `Stop without changes`: leave the official item unchanged and stop.
- `Refine item`: follow `./refine.md` in workflow mode with:

  ```text
  provider: resolved item provider
  parent_item_id: resolved item ID
  parent_item: complete official item context returned by read-item
  needs_refinement_findings: exact findings returned by plan
  ```

  After `/refine` returns for any reason, stop `/pick`. Do not start or replan
  the parent, activate a created child, or trigger `/work`.

### 6. Start Item

Run `../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: resolved item ID
target_status: in progress
```

Report the updated item status.

### 7. Start Work

Follow `./work.md` with the approved plan and the same official item context
(provider ID and item URL when available). The configured item provider remains
authoritative.

---

## Safety

- Pasted text or titles are not official items until matched to the resolved
  provider.
- Do not update item status before the plan is approved.
- Do not trigger `/work` before the item is in its active-work status.
- Do not let `/plan` or `/work` replace the official source item with pasted or
  inferred metadata.
- Do not run `/refine` unless `/plan` returned `needs-refinement`. After
  offering or running `/refine`, stop without updating the parent or triggering
  `/work`.
- Do not select a planning specialist here; `/plan` owns that after required
  context is known.
