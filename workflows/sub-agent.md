# Sub-agent

## Purpose

Select and activate one specialized agent profile.

---

## Input

- `task_context`: available item, request, and conversation context.

---

## Steps

### 1. Select Profile

Keep the active profile when it remains appropriate. Otherwise, load
`../data/agent-routing.md`, select one theme, then its most-specific profile.

Ask the user when either choice is ambiguous. Do not scan agent profiles for
routing.

### 2. Activate Profile

Read the full `../agents/<agent-name>.md` profile without loading its referenced
Skills. Do not rely on frontmatter or partial content.

For the current activity, load only Skills whose explicit profile triggers
apply. Work directly when none apply. Load multiple Skills only when each is
independently required now; never preload them for possible later use.

Re-evaluate routing when the context or activity changes, keeping, adding,
replacing, or stopping Skills accordingly. The profile remains authoritative
over scope, permissions, side effects, and output.

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
