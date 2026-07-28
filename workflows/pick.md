# Pick

## Purpose

This workflow resolves and summarizes one item, delegates to `/plan`, offers
`/refine` when planning returns `needs-refinement`, or resumes after plan
approval to start the item and trigger `/work`.

---

## Entry Condition

Run this workflow after `./play-book.md` selects `pick`, or when the
`pick` skill is explicitly invoked.

If the user provides a provider item ID, retrieve it from the configured
context provider and validate that it can be used for this workflow.

Otherwise, resolve the configured context provider and ask the user to
select one available item.

---

## Steps

### 1. Resolve Context Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

### 2. Retrieve Items

Run `../commands/retrieve-items.md` with:

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

Prepare one selectable option for each retrieved item. Do not replace
the options with a count, status summary, or vague question.

Each option must use a readable label containing at least the title and status.
Attach the provider ID as the internal value. Do not require raw ID selection.

Ask the user which item they want to start using
`../templates/select-option.md` with:

```text
question: Which item do you want to start?
options:
- label: <title> — <status>
  value: <provider id>
- label: <title> — <status>
  value: <provider id>
```

Do not continue to the next step until the selection control or text fallback
has been rendered and the user has selected exactly one item.

### 4. Summarize Item

Run `../commands/read-item.md` with:

```text
provider: resolved item provider
item_id: selected provider ID
fields:
  - title
  - description
  - comments
  - acceptance criteria
  - labels
  - linked resources
  - attachments
```

Keep the returned provider item as the complete official item context.

Present the summary to the user using `../templates/ticket-summary.md`.

Do not continue to the next step until that summary has been shown in the
conversation.

### 5. Create Plan

Create a plan by following `./plan.md`.

Provide the complete official item context and selected provider ID.

Proceed to Step 6 only when the plan workflow returns an approved plan.

If it returns `needs-refinement`, keep and report its concise findings, state
that the item must be refined before an implementation plan can be created,
then ask the user using `../templates/select-option.md` with:

```text
question: Do you want to refine this item?
options:
- label: Refine item
  value: refine
- label: Stop without changes
  value: stop
```

Handle the decision as follows:

- `stop`: report that refinement was declined, leave the official item
  unchanged, and stop this workflow;
- `refine`: follow `./refine.md` in workflow mode with:

  ```text
  provider: resolved item provider
  parent_item_id: selected provider ID
  parent_item: complete official item context returned by read-item
  needs_refinement_findings: exact findings returned by plan
  ```

After `/refine` returns for any reason, stop `/pick`. Do not start or replan the
parent, select or activate a created child, or trigger `/work`.

### 6. Start Item

Run `../commands/start-item.md` with:

```text
provider: resolved item provider
item_id: selected provider ID
target_status: in progress
```

Report the updated item status to the user.

### 7. Start Work

Start implementation by following `./work.md`.

Provide the approved plan and the active item context.

---

## Safety

* Pasted text or titles are not official items until matched to the
  provider.
* Prefer direct deterministic filtering over exploratory MCP probing.
* Do not proceed from item retrieval to summarization without rendering the
  item selection.
* Do not proceed from summarization to planning without presenting the ticket
  summary to the user first.
* Do not update the item status before the plan has been approved.
* Do not trigger `/work` before the selected item has been moved to
  the active-work status.
* Do not run `/refine` unless `/plan` has returned `needs-refinement` for the
  selected official item.
* Do not update the parent status or trigger `/work` after offering or running
  `/refine`, regardless of its terminal outcome.
* Do not select or activate a specialist sub-agent in this workflow. The plan
  workflow owns planning sub-agent selection after required context is known.

---

## Success Criteria

This workflow is complete when:

* the item provider has been resolved;
* matching items have been rendered as selectable options, or zero
  matches have been explicitly reported;
* one official item has been selected;
* the selected item has been summarized;
* one of these outcomes has been reached:
  * `/plan` returned `needs-refinement`, the user declined refinement, the item
    remained unchanged, and `/work` was not triggered;
  * `/plan` returned `needs-refinement`, `/refine` received the resolved
    provider, complete official item, provider ID, and exact findings, then
    `/pick` stopped without activating the parent or triggering `/work`;
  * `/plan` returned an approved plan, the item was moved to the in progress
    status, and `/work` was triggered with the approved plan.
