# Sub-agent

## Purpose

Select and activate the most appropriate sub-agent profile for the current task.

Selection chooses a role. Activation makes that role effective by loading the
full profile and its required resources.

---

## Trigger

Run this workflow when a routing workflow asks for sub-agent selection, or when
the current task needs a specialist profile and no appropriate profile is active.

---

## Input

Use the available task context:

* backlog item summary;
* developer request;
* current conversation objective.

---

## Steps

### 1. Select Profile

Select exactly one primary profile from `.agents/agents/`.

Prefer the most specific relevant profile. If the task is ambiguous, ask the
developer to confirm.

### 2. Load Profile

Read the full selected profile file:

```text
.agents/agents/<agent-name>.md
```

Do not rely on frontmatter or partial content.

### 3. Load Required Resources

Load only resources explicitly referenced by the selected profile and required
for the current task.

Do not load generic documentation unless the selected profile explicitly
requires it.

### 4. Confirm Activation

Confirm activation using `.agents/templates/sub-agent-activation.md`.

Emit one user-facing report only, after the profile and required resources have
been loaded.

---

## Re-activation

Before selecting a profile, check whether the active profile is still
appropriate for the current task.

If it is appropriate, keep using it.

If it is missing or no longer appropriate, run this workflow from the beginning.

---

## Safety

* Do not announce activation before loading the full profile.
* Do not start implementation when called from a routing workflow.

---

## Success Criteria

This workflow is complete when:

* one primary profile has been selected;
* the full profile has been read;
* required resources have been loaded;
* activation has been confirmed.
