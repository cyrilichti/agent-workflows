# Refine Execute

## Input

| Input | Requirement |
| --- | --- |
| `provider` | Resolved item provider |
| `parent_item` | Complete official parent item |
| `needs_refinement_findings` | Preserved assessment findings |

---

## Steps

### 1. Draft the Decomposition

Follow `./specialist.md` with:

```text
task_context:
  parent_item: complete official parent item
  needs_refinement_findings: preserved refinement findings
```

Keep the selected specialist as sole author. It may inspect relevant technical
context read-only.

Have it load `../skills/to-tickets/SKILL.md` completely and apply only Steps
1–3 through `Draft vertical slices`. The provider-neutral draft must contain
at least two useful children that can be delivered or verified separately and
cover the parent scope exactly once. Prefer vertical slices for features; use
a justified expansion, migration, and removal sequence for a wide change when
independent vertical slices cannot remain valid. If the scope is indivisible,
return `refinement-not-needed`. Each child has a stable reference, meaningful
title, and free-form Markdown body that communicates:

- the observable outcome it delivers;
- the verifiable conditions under which it is complete;
- every parent constraint or exclusion that materially applies to it;
- every unresolved question that prevents an implementation decision, when
  applicable.

Return an acyclic graph of genuine blockers using:

```text
blocked_ref: stable reference of the child that waits
blocking_ref: stable reference of the child that must complete first
```

Return the draft before Step 4 of `to-tickets`. This workflow owns confirmation
and provider operations.

### 2. Review the Decomposition

Verify the draft against Step 1. Return deficiencies and the complete draft to
the same specialist for revision, then review it again before any preview.

### 3. Confirm the Decomposition

Present the complete reviewed decomposition in this format:

```markdown
**Proposed decomposition**

### 1. <child title>

<exact child Markdown body>

Blocked by: <number and title of each blocking child, when applicable>

### 2. <child title>

<exact child Markdown body>

Blocked by: <number and title of each blocking child, when applicable>
```

Repeat the child section in stable proposal order. Preserve each title and
body exactly. Resolve `blocked_ref` to the child that displays `Blocked by` and
`blocking_ref` to the numbered child it waits for. Omit that line when there
is no blocker. Keep blocking relations outside child bodies. The preview does
not include provider fields or imply creation.

Then ask using `../templates/select-option.md` with:

```text
question: What do you want to do with this decomposition?
options:
- Confirm and create all child items
- Adjust the decomposition
- Cancel without changes
```

- `Adjust the decomposition`: return the adjustment and current draft to the
  same specialist, then repeat Step 2.
- `Cancel without changes`: report `cancelled` under
  `../goals/refine-complete.md`.
- `Confirm and create all child items`: preserve the exact latest preview and
  continue.

### 4. Create the Confirmed Decomposition

Follow `./refine-create.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
children: exact confirmed children in preview order
blocking_edges: exact confirmed blocking edges
```
