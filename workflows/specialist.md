# Specialist

## Purpose

Route and activate one specialized profile for an activity.

---

## Input

- `task_context`: context already available to the caller for the activity, in
  its existing shape. Do not require the caller to collect or reshape context
  for this workflow.

---

## Steps

### 1. Select Profile

Keep the active profile when appropriate. Otherwise, load
`../data/agent-routing.md` and determine whether `task_context` maps to one of
its themes. When no theme matches, end this workflow silently without choosing
a placement, activating a profile, or reporting an activation. When a theme
matches, select its most-specific profile.

Re-evaluate this selection when the activity changes enough to make the active
profile potentially unsuitable.

Ask the user when either choice is ambiguous. Do not scan agent profiles for
routing.

### 2. Choose Placement

Apply the profile in the current agent when its output or interaction is
relevant to the main conversation.

Use a separate thread only when the complete output does not need to appear in
the main conversation and the caller can consume or restate the useful result.

### 3. Activate Profile

In the selected placement, read the full `../agents/<agent-name>.md` profile
and apply it to `task_context`. Do not rely on frontmatter or partial content.

### 4. Report Activation

After activating the profile, report using
`../templates/specialist-activation.md` with:

```text
name: readable activated profile name
reason: short reason related to task_context
```

End this workflow after reporting the activation.
