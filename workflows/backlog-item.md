# Backlog Item

## Purpose

Prepare a work session from a configured backlog provider.

This workflow resolves the backlog context source, selects the item to start,
retrieves and summarizes its context, activates the appropriate specialist
agent, and optionally moves the item to an in-progress state.

It stops before implementation. Its outcome is a ready-to-start work session
with a clear backlog item, source context, and activated specialist.

---

## Entry Condition

Run this workflow after `workflows/play-book.md` selects `backlog-item`.

If the developer provides a work item ID or URL, retrieve it from the configured
context provider and validate that it can be used for this workflow.

Otherwise, resolve the configured context provider and ask the developer to
select one available work item.

---

## Steps

### 1. Resolve Context Provider

Run `commands/resolve-context-provider.md` with:

```text
workflow: backlog-item
```

### 2. Retrieve Work Items

Run `commands/retrieve-work-items.md` with:

```text
provider: resolved context provider
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

### 3. Select Work Item

Prepare the retrieved work items with the title as the visible label and the
provider ID as the internal value. Do not require raw ID selection.

Ask the developer which work item they want to start using
`.agents/templates/select-option.md`.

### 4. Summarize Work Item

Read only the selected work item from the provider.

Retrieve the provider fields needed to understand the requested work, such as
title, description, comments, acceptance criteria, labels, linked resources, or
attachments when available.

Present a brief summary using `.agents/templates/ticket-summary.md`.

### 5. Select Sub-agent

Select and activate the sub-agent profile by following
`.agents/workflows/sub-agent.md`.

## Safety

* Pasted text or titles are not official work items until matched to the
  provider.
* Prefer direct deterministic filtering over exploratory MCP probing.
