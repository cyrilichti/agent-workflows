# Plan Confirm Branch

## Purpose

Assess, draft, review, and confirm one plan from resolved context.

---

## Entry Condition

Run from a context branch with:

- `task_context`: objective, problem, and expected outcome;
- `plan_id`: stable plan identity;
- `entry_mode`: `workflow` or `standalone`.

---

## Steps

### 1. Check Planifiability

Run `../commands/assess-refinement-need.md` with:

```text
context: task_context
```

On `refinement-not-needed`, continue.

On `needs-refinement`:

- in `workflow` mode, return the findings to the caller, which owns any
  refinement offer;
- in `standalone` mode, report the findings and stop.

### 2. Resolve Planning Author

Select and activate one specialized plan author by following `./sub-agent.md`
with `task_context`.

The specialist may inspect relevant technical context but must not modify it.
If that inspection reveals autonomous delivery units, reassess the expanded
context with Step 1.

### 3. Draft and Review the Plan

Route these Skills as needed:

- `planning-and-task-breakdown`: always, before drafting;
- `source-driven-development`: when a decision depends on an external
  versioned fact not established locally;
- `doubt-driven-development`: after a draft containing high-risk or unfamiliar
  non-trivial decisions.

The specialist is the sole plan author. Have it write using
`../templates/plan.md` with:

```text
task_context: resolved task context
planId: plan_id
initial_todo_status: pending
```

The local template, file location, and read-only planning boundary override
conflicting Skill instructions.

When `doubt-driven-development` applies, run one single-model fresh-context
review. Reconcile its findings and request at most one revision from the
specialist. Report remaining substantive uncertainty. Do not offer or invoke a
cross-model review unless the user explicitly requests it.

### 4. Confirm Plan

Present using `../templates/plan-summary.md` with:

```text
name: created plan name
file: created plan path
todo_count: number of created plan todos
```

Then ask using `../templates/select-option.md` with:

```text
question: What do you want to do with this plan?
options:
- Approve plan
- Adjust plan
```

On `Adjust plan`, give the adjustment and unchanged `plan_id` to the active
specialist, then repeat this step with the revised plan.

Continue only on `Approve plan`.

### 5. Finish

Finish according to `../goals/plan-complete.md`.

Return the approved plan in `workflow` mode; otherwise stop.
