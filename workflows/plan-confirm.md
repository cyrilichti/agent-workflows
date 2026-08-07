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

The specialist is the sole author. Load and apply Skills only within these
bounds:

| Skill | Trigger | Bounded use |
| --- | --- | --- |
| `planning-and-task-breakdown` | Always; reuse the Step 1 load | Order dependencies, prefer vertical slices, and create the fewest small, verifiable todos. Ignore its formats, paths, estimates, file lists, checkpoints, and templates. |
| `source-driven-development` | A decision depends on an unverified external versioned fact | Verify and cite only that fact. Ignore its implementation process. |
| `doubt-driven-development` | The draft contains high-risk or unfamiliar decisions | Run CLAIM, EXTRACT, DOUBT, and RECONCILE once. Ignore its loop and cross-model procedure. |

Have the specialist write using `../templates/plan.md` with:

```text
task_context: resolved task context
planId: plan_id
```

For doubt review, pass only the affected decision excerpts and local planning
contract. Give actionable findings to the author for one revision: put
implementation gaps in todos, verification gaps in `Validation`, and unresolved
decisions in `Open Questions`. Discard commentary and report remaining
uncertainty. Run nothing further unless requested.

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
