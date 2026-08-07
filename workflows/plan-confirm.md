# Plan Confirm Branch

## Purpose

Assess, author, and confirm one plan.

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

Continue on `refinement-not-needed`. On `needs-refinement`:

- in `workflow` mode, return the findings to the caller, which owns any
  refinement offer;
- in `standalone` mode, report the findings and stop.

### 2. Resolve Planning Author

Follow `./sub-agent.md` with `task_context` to activate one plan author. The
author may inspect technical context read-only. If that reveals autonomous
delivery units, reassess the expanded context with Step 1.

### 3. Draft and Review the Plan

The specialist is the sole plan author. It may load and apply:

| Skill | Trigger | Bounded use |
| --- | --- | --- |
| `planning-and-task-breakdown` | Always; reuse the Step 1 load | Order dependencies, prefer vertical slices, and create the fewest small, verifiable todos. Ignore its formats, paths, estimates, file lists, checkpoints, and templates. |
| `source-driven-development` | A decision depends on an unverified external versioned fact | Verify and cite only that fact. Ignore its implementation process. |

Have the specialist write using `../templates/plan.md` with:

```text
task_context: resolved task context
planId: plan_id
```

For high-risk or unfamiliar decisions, the workflow—not the author—loads
`doubt-driven-development` and invokes one fresh-context reviewer while keeping
the plan author active. Apply only CLAIM, EXTRACT, DOUBT, and RECONCILE once
with:

```text
artifact: affected decision excerpts
contract: task_context and local plan contract
```

Do not pass planning history or author reasoning. Reconcile findings and ask the
same author for one revision: implementation gaps go to todos, verification
gaps to `Validation`, and unresolved decisions to `Open Questions`. Ignore
multi-cycle and cross-model procedures, discard review commentary, and report
remaining substantive uncertainty. Run no further review unless requested.

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

Finish according to `../goals/plan-complete.md`: return the approved plan in
`workflow` mode; otherwise stop.
