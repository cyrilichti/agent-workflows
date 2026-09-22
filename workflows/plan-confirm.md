# Plan Confirm Branch

## Purpose

Assess, author, approve, and persist one executable plan.

---

## Entry Condition

Run from a context branch with:

- `task_context`: objective, problem, and expected outcome;
- `entry_mode`: `caller` or `standalone`.

---

## Steps

### 1. Check Planifiability

Run `../commands/assess-refinement-need.md` with:

```text
context: task_context
```

Continue on `refinement-not-needed`. On `needs-refinement`:

- in `caller` mode, return the findings to the caller, which owns any
  refinement offer;
- in `standalone` mode, report the findings and stop.

### 2. Resolve Planning Author

Follow `./specialist.md` with `task_context` to activate one plan author.
Require one successfully activated profile; when routing selects none or
activation fails, report that no planning author is available and stop without
a proposal or plan file. The author may inspect the technical context required
for the proposal and returns proposal content only; reject implementation or
repository changes as an invalid author result. If the inspection reveals
autonomous delivery units, reassess the expanded context with Step 1.

### 3. Draft and Review the Proposal

The specialist is the sole proposal author. Apply planning support with these
owners:

| Owner | Skill | Trigger | Bounded use |
| --- | --- | --- | --- |
| Workflow | `planning-and-task-breakdown` | Always; reuse the Step 1 load | Ask the author for dependency-ordered, vertically sliced, minimal verifiable todos. Ignore its formats, paths, estimates, file lists, checkpoints, and templates. |
| Author | `source-driven-development` | A decision depends on an unverified external versioned fact | Verify and cite only that fact. Ignore its implementation process. |

Have the specialist return one complete proposal using `../templates/plan.md`
with:

```text
task_context: resolved task context
```

Keep the proposal in the execution context. Do not create its plan file before
approval.

For decisions that meet the `doubt-driven-development` trigger, the workflow,
not the author, loads and follows that Skill with:

```text
artifact: affected decision excerpts
contract: task_context and local plan contract
```

Return valid actionable findings to the same author for revision. Put
implementation gaps in todos and verification gaps in `Validation`; treat any
remaining material uncertainty as a question for Step 4.

### 4. Resolve Material Questions

Before presenting the final proposal, collect every question whose answer could
materially change its Objective, Expected Outcome, todos, order, or Validation.
Return the answers to the same specialist and require a revised complete
proposal.
Repeat until no material question remains. Only non-material notes may remain
under `Open Questions`.

### 5. Confirm and Persist Plan

Present the complete final proposal, then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this plan?
options:
- Approve plan and autonomous delivery
- Adjust plan
```

On `Adjust plan`, give the adjustment to the active specialist, then repeat
this step with the revised proposal.

State that approval authorizes non-empty commits, normal pushes, request
creation and promotion, request comments, item transitions and labels, review
publication, and corrective loops through successful `/inspect`. It never
authorizes merge, completion, or `/done`.

Continue only on `Approve plan and autonomous delivery`.

After approval, resolve one unused file path and persist the exact approved
proposal according to `../templates/plan.md`. Stop if persistence fails. Then
present `../templates/plan-summary.md` with:

```text
name: persisted plan name
file: persisted plan path
todo_count: number of persisted plan todos
```

### 6. Finish

Finish according to `../goals/plan-complete.md`: return the approved plan in
`caller` mode; otherwise stop.
