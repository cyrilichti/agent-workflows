# Sub-agent

## Purpose

Select and activate one specialized agent profile.

---

## Input

- `task_context`: available item, request, and conversation context.

---

## Steps

### 1. Select Profile

Keep the active profile when it remains appropriate. Otherwise, select exactly
one most-specific profile from `../agents/`. Ask the user when the choice is
ambiguous.

### 2. Activate Profile

Read the full `../agents/<agent-name>.md` profile, then load only its referenced
resources required for `task_context`. Do not rely on frontmatter or partial
content.

### 3. Report Activation

After loading the profile and required resources, report using
`../templates/sub-agent-activation.md` with:

```text
name: readable activated profile name
reason: short reason related to task_context
```

---

## Safety

- Do not announce activation before the profile is loaded.
- Do not start implementation when invoked by a routing workflow.
