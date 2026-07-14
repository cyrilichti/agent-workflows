# Plan

## Purpose

Create a plan before implementation starts.

This workflow turns existing task context, or context collected from the
developer, into a plan file saved under `.agents/plans/`.

---

## Entry Condition

Run this workflow in one of these modes:

* **Workflow mode**: another workflow calls this workflow and provides the task
  context and active sub-agent.
* **Standalone mode**: `workflows/play-book.md` selects `plan`, with no prior
  task context.

---

## Required Context

A plan needs:

- objective: what must be achieved;
- problem: what must be solved and why it matters;
- expected outcome: how success will be recognized.

Optional context (use when available):

- backlog provider ID (for file naming);
- active sub-agent profile.

---

## Steps

### 1. Resolve Context

Check whether the current conversation already provides the required context.

If objective, problem, and expected outcome are available, continue with the
active sub-agent when one is already active.

If any required context is missing, activate `.agents/agents/interviewer.md` and
ask the developer only for the missing information.

### 2. Draft Plan File

Create a plan file following `.agents/templates/work-plan.md`.

Requirements:

- Follow the template format: YAML frontmatter with `name`, `overview`, `todos`,
  and `isProject`, plus a markdown body.
- Use the native plan file extension of the AI tool creating the file when one
  exists (for example `.plan.md` in Cursor Plan mode); otherwise use `.md`.
- Map each implementation step to exactly one todo (`id`, `content`, `status:
  pending`). The `## Steps` section must contain the same number of items, in the
  same order.
- Write the file to `.agents/plans/` using the naming rules from the template.
- Keep the plan concise and practical. Do not create a full implementation
  specification.

### 3. Confirm Plan

Present a short summary in the conversation:

- plan file link (prefer `.cursor/plans/<filename>` — it
  is a symlink to `plans/` and enables Cursor Plan UI formatting);
- objective and expected outcome;
- todo list (titles only).

Verify before presenting: the number of todos equals the number of items under
`## Steps`.

Ask the developer to approve or adjust the plan using
`.agents/templates/select-option.md` with:

```text
Approve plan
Adjust plan
```

If the developer selects `Adjust plan`, collect the requested adjustments,
update the plan file, and present it for confirmation again.

Do not start implementation before the plan has been approved.

---

## Safety

* Do not invent missing objective, problem, or expected outcome.
* Do not start implementation.
* Do not overwrite an existing plan file without explicit developer approval;
  use a numeric suffix instead.
* Do not present a plan when the todo count differs from the `## Steps` count.

---

## Success Criteria

This workflow is complete when:

* the required context is known;
* a plan file exists under `.agents/plans/`;
* the developer has approved the plan.
