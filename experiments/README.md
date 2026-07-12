# Experiments

Experiments record feedback from agentic setup trials.

They are used to capture what was tested, what worked, what failed, and what
should become durable project knowledge.

## Responsibilities

Use experiments to:

- document workflow, MCP, provider, skill, or agent trials;
- keep one report per session;
- identify learnings worth promoting to durable documentation.

## Boundaries

Experiments are not product features, business rules, or permanent project
memory.

Move durable conclusions to the appropriate long-lived resource. Link external
work items and project documentation instead of duplicating their content.

## Structure

One file per session:

```text
YYYY-MM-DD-<short-slug>.md
```

## Example

```markdown
# Experiment: {title}

**Outcome:** success | partial | failed
**Date:** YYYY-MM-DD
**Playbook:** … (if used)
**Agent:** Cursor
**Tickets:** [name](url)
**Deliverable:** path (if any)

## Results

| Area | Status | Notes |
| ---- | ------ | ----- |

Only include rows for areas actually tested.

## Learnings

* …
```
