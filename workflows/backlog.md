# Backlog

## Purpose

Prepare a work session from a configured backlog provider.

This workflow resolves the backlog context source, selects the item to start,
retrieves and summarizes its context, then delegates to the plan
workflow.

It stops before implementation. Its outcome is a ready-to-start work session
with a clear backlog item, source context, and delegated plan.

---

## Entry Condition

Run this workflow after `workflows/play-book.md` selects `backlog`.

If the developer provides a work item ID or URL, retrieve it from the configured
context provider and validate that it can be used for this workflow.

Otherwise, resolve the configured context provider and ask the developer to
select one available work item.

---

## Steps

### 1. Resolve Context Provider

Run `commands/resolve-backlog-provider.md` with:

```text
workflow: backlog
```

### 2. Retrieve Work Items

Run `commands/retrieve-backlog-items.md` with:

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

Prepare the retrieved backlog items with the title as the visible label and the
provider ID as the internal value. Do not require raw ID selection.

Ask the developer which backlog item they want to start using
`.agents/templates/select-option.md`.

### 4. Summarize Backlog Item

Read only the selected backlog item from the provider.

Retrieve the provider fields needed to understand the requested work, such as
title, description, comments, acceptance criteria, labels, linked resources, or
attachments when available.

Present a brief summary using `.agents/templates/ticket-summary.md`.

### 5. Create Plan

Create a plan by following `.agents/workflows/plan.md`.

Provide the selected backlog item summary, provider ID, and context.

---

## Safety

* Pasted text or titles are not official work items until matched to the
  provider.
* Prefer direct deterministic filtering over exploratory MCP probing.
* Do not select or activate a specialist sub-agent in this workflow. The plan
  workflow owns planning sub-agent selection after required context is known.

---

## Success Criteria

This workflow is complete when:

* the backlog provider has been resolved;
* one official backlog item has been selected;
* the selected backlog item has been summarized;
* the plan workflow has been called with the selected item context.
