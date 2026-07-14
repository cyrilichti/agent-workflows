# Goals

This directory contains reusable project goals.

A goal defines the **desired outcome** that an AI agent or contributor should achieve.

Unlike a workflow, which describes how work is organized, a goal describes **when the work is considered complete**.

Goals encourage outcome-oriented execution rather than task-oriented execution.

---

## Purpose

Use goals to define:

* desired outcomes;
* success criteria;
* completion conditions;
* validation requirements;
* stopping conditions.

A goal should answer the question:

> **"What does success look like?"**

---

## What does NOT belong here

Do not describe:

* implementation steps (use `workflows/`);
* reusable capabilities (use `skills/`);
* agent roles (use `agents/`);
* project knowledge (use `domain/`);
* engineering conventions (use `rules/`).

Goals define the destination, not the journey.

---

## Organization

Each goal should be described in its own Markdown document.

```text
goals/
├── README.md
├── feature-complete.md
├── bug-resolved.md
├── release-ready.md
└── ...
```

---

## Example

```markdown
# Bug Resolved

## Objective

Resolve the reported issue.

## Success Criteria

- The root cause has been addressed.
- The bug can no longer be reproduced.
- Automated tests pass.
- No regression has been introduced.

## Human Validation

Required before closing.

## Completion

Stop when all success criteria have been validated.
```

---

## Best Practices

* One goal should describe one outcome.
* Express goals as measurable results.
* Keep success criteria objective.
* Explicitly define when to stop.
* Clearly indicate when human approval is required.
