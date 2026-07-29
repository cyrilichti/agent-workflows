# Plan

## Purpose

Confirm that the task can be planned as one delivery unit, then create a plan
before implementation starts.

This workflow turns existing task context, or context collected from the
user, into a plan file saved under `../plans/`. It returns
`needs-refinement` instead when the context contains multiple autonomous
delivery units.

---

## Entry Condition

Run this workflow in one of these modes:

* **Workflow mode**: another workflow calls this workflow and provides the task
  context. Return either an approved plan or `needs-refinement` to the caller.
* **Standalone mode**: `./play-book.md` selects `plan`, or the `plan` skill is
  explicitly invoked, with no calling workflow or specialized sub-agent.
  Resolve task context from the current request before planning. Stop after
  plan approval or after reporting `needs-refinement`.

---

## Required Context

A plan needs:

* objective: what must be achieved;
* problem: what must be solved and why it matters;
* expected outcome: how success will be recognized.

Optional context (use when available):

* item provider ID (for file naming).

In workflow mode, use the official item context supplied by the caller.

In standalone mode, use the current request when it already provides the
required context. Otherwise, derive one lightweight transient item with
`item-writer` and use it as planning context.

---

## Steps

### 1. Resolve Context

In workflow mode, check the item context supplied by the caller and the current
conversation. Preserve the official item as provided. If required planning
context is still missing, ask the user only for the missing information. Do not
rewrite the official item or activate `item-writer`.

In standalone mode, check whether the current request and conversation already
provide the required context. If they do, continue without activating an
authoring sub-agent.

If standalone context is insufficient, activate `../agents/item-writer.md` by
loading its full profile and the resources required for the current context.
Give it:

* the user's request and relevant conversation context;
* only the code, specifications, files, or URLs explicitly identified by the
  user;
* `../templates/item.md` as its output contract;
* the instruction to return one lightweight item that contains only the
  context needed to begin specialized planning.

Let `item-writer` route and reroute its writing Skills until it returns exactly
one meaningful title and one free-form Markdown body from which the objective,
problem, and expected outcome are known. Keep the returned item as transient
task context.

### 2. Check Planifiability

Run `../commands/assess-refinement-need.md` with the complete task context.

On `refinement-not-needed`, continue planning.

On `needs-refinement`, return its findings to the caller in workflow mode or
report them and stop in standalone mode.

### 3. Resolve Planning Author

Select and activate the most appropriate specialized sub-agent by following
`./sub-agent.md`.

The specialist is the sole plan author. During this workflow, it may inspect
the relevant local technical context but must not modify it.

If this analysis reveals hidden autonomous units, run
`../commands/assess-refinement-need.md` again with the expanded context and
apply the outcome defined in Step 2.

### 4. Route Planning Skills and Draft the Plan

Use external Skills as methods within this workflow. The local authorship,
template, file location, and no-implementation boundaries remain authoritative.

Route Skills according to the planning phase:

* `planning-and-task-breakdown`: always. The specialist loads it before
  drafting to map dependencies, prefer vertical slices, and create small,
  verifiable todos.
* `source-driven-development`: when technical analysis or drafting reveals that
  a plan decision depends on an external versioned fact not established
  locally. The specialist loads it, verifies only the required facts against
  official sources, and includes the findings and citations in the plan.
* `doubt-driven-development`: after the draft, when it contains high-risk or
  unfamiliar non-trivial decisions. The workflow loads it and runs the bounded
  fresh-context adversarial review.

The specialist remains the sole plan author and writes the plan following
`../templates/plan.md`.

When adversarial review produces actionable findings, the workflow reconciles
them once and asks the specialist to revise the plan once.

Run exactly one single-model fresh-context adversarial review by default. After
the resulting revision, do not automatically review the revised plan again.
Proceed to plan confirmation instead.

If substantive uncertainty remains after reconciliation, report it with the
revised plan so the user can request an adjustment or explicitly ask for
another review. Do not start another adversarial cycle on the workflow's own
initiative.

Do not offer or invoke cross-model review unless the user explicitly requests
an additional cross-model opinion.

### 5. Confirm Plan

Present the created plan using `../templates/plan-summary.md`.

Ask the user to approve or adjust the plan using
`../templates/select-option.md` with:

```text
question: What do you want to do with this plan?
options:
- Approve plan
- Adjust plan
```

If the user selects `Adjust plan`, collect the requested adjustments,
update the plan file, and present it for confirmation again.

### 6. Return or Stop

After the plan is approved:

* in workflow mode, return control to the calling workflow;
* in standalone mode, stop.

---

## Safety

* Do not invent missing objective, problem, or expected outcome.
* Do not start implementation.
* Do not treat a transient item as an official provider item.
* Do not create the plan with `item-writer` as the active planning sub-agent.
* Do not select a planning sub-agent before objective, problem, and expected
  outcome are available.
* Do not run more than one adversarial review cycle unless the user explicitly
  requests another review.

---

## Success Criteria

This workflow is complete when:

* the required context is known;
* standalone context has remained conversational or has been represented by
  exactly one non-persisted transient item;
* one of these outcomes has been reached:
  * `needs-refinement` has been returned or reported with concise findings,
    without a plan file;
  * one specialized plan author is active, the relevant local technical context
    has been inspected, a plan file exists under `../plans/`, and the user has
    approved it;
* control has been returned to the caller in workflow mode, or the workflow
  has stopped in standalone mode.
