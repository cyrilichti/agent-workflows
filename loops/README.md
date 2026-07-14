# Loops

This directory contains reusable execution loops.

A loop defines **how an AI agent should iteratively work toward a goal**.

Unlike a workflow, which orchestrates a business process, a loop describes the agent's reasoning cycle while performing a task.

Loops help agents remain autonomous while providing clear stopping conditions.

---

## Purpose

Use loops to define repeatable execution patterns such as:

* fix until tests pass;
* review until no critical issues remain;
* improve until acceptance criteria are satisfied;
* refine until human validation.

A loop should answer the question:

> **"How should the agent continue working until the goal is achieved?"**

---

## What does NOT belong here

Do not describe:

* business processes (use `workflows/`);
* business knowledge (use `domain/`);
* project conventions (use `rules/`);
* reusable capabilities (use `skills/`);
* output formats (use `templates/`).

Loops define an execution strategy.

---

## Organization

Each loop should be described in its own Markdown document.

```text
loops/
├── README.md
├── fix-until-tests-pass.md
├── review-until-clean.md
├── refine-until-approved.md
└── ...
```

---

## Example

```markdown
# Fix Until Tests Pass

## Goal

Deliver a working implementation.

## Loop

1. Analyze the failure.
2. Plan a minimal fix.
3. Apply the fix.
4. Execute the relevant tests.
5. Review the results.
6. Repeat until all tests pass.

## Stop Conditions

- All tests pass.
- Human intervention is required.
- The issue cannot be resolved with the available context.

## Escalation

Request human assistance when blocked.
```

---

## Best Practices

* Define one execution strategy per loop.
* Keep loops deterministic whenever possible.
* Always define explicit stopping conditions.
* Prefer measurable validation over subjective evaluation.
* Escalate to a human when progress is no longer possible.
