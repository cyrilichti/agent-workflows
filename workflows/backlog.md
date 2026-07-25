# Backlog

## Purpose

Prepare a work session from a configured backlog provider.

This workflow resolves the backlog context source, selects the item to start,
retrieves and summarizes its context, delegates to the plan workflow, then marks
the selected item as in progress.

It stops before implementation. Its outcome is a ready-to-start work session
with a clear backlog item, source context, approved plan, and active backlog
status.

---

## Entry Condition

Run this workflow after `./play-book.md` selects `backlog`, or when the
`backlog` skill is explicitly invoked.

If the developer provides a work item ID or URL, retrieve it from the configured
context provider and validate that it can be used for this workflow.

Otherwise, resolve the configured context provider and ask the developer to
select one available work item.

---

## Steps

### 1. Resolve Context Provider

Run `../commands/resolve-backlog-provider.md` with:

```text
workflow: backlog
```

### 2. Retrieve Work Items

Run `../commands/retrieve-backlog-items.md` with:

```text
provider: resolved backlog provider
criteria:
  assigned_to: current developer
  status: open or ready to start
  exclude:
    - assigned to other people
    - in progress
    - done
    - closed
  scope: do not list the full backlog
```

### 3. Select Backlog Item

Prepare one selectable option for each retrieved backlog item. Do not replace
the options with a count, status summary, or vague question.

Each option must use a readable label containing at least the title and status.
Attach the provider ID as the internal value. Do not require raw ID selection.

Ask the developer which backlog item they want to start using
`../templates/select-option.md` with:

```text
question: Which backlog item do you want to start?
options:
- label: <title> — <status>
  value: <provider id>
- label: <title> — <status>
  value: <provider id>
```

Do not continue to the next step until the selection control or text fallback has
been rendered and the developer has selected exactly one backlog item.

### 4. Summarize Backlog Item

Read only the selected backlog item from the provider.

Retrieve the provider fields needed to understand the requested work, such as
title, description, comments, acceptance criteria, labels, linked resources, or
attachments when available.

Present a brief summary using `../templates/ticket-summary.md`.

### 5. Create Plan

Create a plan by following `./plan.md`.

Provide the selected backlog item summary, provider ID, and context.

Continue only after the plan workflow has completed successfully.

### 6. Start Backlog Item

Run `../commands/start-backlog-item.md` with:

```text
provider: resolved backlog provider
item_id: selected provider ID
target_status: in progress
```

Report the updated backlog item status to the developer.

---

## Safety

* Pasted text or titles are not official work items until matched to the
  provider.
* Prefer direct deterministic filtering over exploratory MCP probing.
* Do not proceed from backlog retrieval to summarization without rendering the
  backlog item selection.
* Do not update the backlog item status before the plan has been approved.
* Do not select or activate a specialist sub-agent in this workflow. The plan
  workflow owns planning sub-agent selection after required context is known.

---

## Success Criteria

This workflow is complete when:

* the backlog provider has been resolved;
* matching backlog items have been rendered as selectable options, or zero
  matches have been explicitly reported;
* one official backlog item has been selected;
* the selected backlog item has been summarized;
* the plan workflow has completed successfully with developer approval;
* the selected backlog item has been moved to the active-work status.
