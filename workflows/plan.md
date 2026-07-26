# Plan

## Purpose

Create a plan before implementation starts.

This workflow turns existing task context, or context collected from the
user, into a plan file saved under `../plans/`.

---

## Entry Condition

Run this workflow in one of these modes:

* **Workflow mode**: another workflow calls this workflow and provides the task
  context. After approval, return control to the caller.
* **Standalone mode**: `./play-book.md` selects `plan`, or the `plan` skill is
  explicitly invoked, with no prior task context or specialized sub-agent.
  After approval, stop.

---

## Required Context

A plan needs:

* objective: what must be achieved;
* problem: what must be solved and why it matters;
* expected outcome: how success will be recognized.

Optional context (use when available):

* item provider ID (for file naming).

---

## Steps

### 1. Resolve Context

Check whether the current conversation already provides the required context.

If any required context is missing, activate `../agents/interviewer.md` and
ask the user only for the missing information.

The interviewer is only used to collect missing planning context. It does not
become the sub-agent responsible for creating the plan.

### 2. Resolve Planning Sub-agent

Once objective, problem, and expected outcome are available, ensure a
specialized
sub-agent is active before creating the plan.

Select and activate the most appropriate specialized sub-agent by following
`./sub-agent.md`.

### 3. Create Plan File

Create a plan file following `../templates/plan.md`.

### 4. Confirm Plan

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

### 5. Return or Stop

After the plan is approved:

* in workflow mode, return control to the calling workflow;
* in standalone mode, stop.

---

## Safety

* Do not invent missing objective, problem, or expected outcome.
* Do not start implementation.
* Do not create the plan with `interviewer` as the active planning sub-agent.
* Do not select a planning sub-agent before objective, problem, and expected
  outcome are available.

---

## Success Criteria

This workflow is complete when:

* the required context is known;
* a specialized planning sub-agent is active;
* a plan file exists under `../plans/`;
* the user has approved the plan;
* control has been returned to the caller in workflow mode, or the workflow has
  stopped in standalone mode.
