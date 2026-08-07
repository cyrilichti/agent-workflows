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

The specialist is the sole plan author.

Reuse `planning-and-task-breakdown` from Step 1 without loading it again. For
drafting, use it only to order dependencies, prefer vertical slices, and
produce the fewest small, verifiable todos. Do not follow that Skill's task
format, output paths, estimates, file lists, checkpoints, or templates.

When a decision depends on an external versioned fact not established locally,
load `source-driven-development` only to verify that fact against an official
source and cite the finding. Do not follow its implementation process or expand
verification to unrelated decisions.

Have the specialist write using `../templates/plan.md` with:

```text
task_context: resolved task context
planId: plan_id
initial_todo_status: pending
```

After a draft containing high-risk or unfamiliar non-trivial decisions, load
`doubt-driven-development` under this contract:

- apply CLAIM, EXTRACT, DOUBT, and RECONCILE once;
- give the reviewer only the affected decision excerpts and the local planning
  contract, not the full planning history;
- ignore its multi-cycle loop and cross-model procedure;
- send actionable findings to the specialist for one revision;
- place implementation gaps in todos, verification gaps in `Validation`, and
  unresolved decisions in `Open Questions`; do not persist review commentary.

Report substantive uncertainty that remains after the revision. Do not run
another review or offer cross-model review unless the user requests it.

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
