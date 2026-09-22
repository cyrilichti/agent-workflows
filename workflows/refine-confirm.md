# Refine Confirm Branch

## Entry Condition

Run with a resolved provider, complete official parent item, and preserved
`needs-refinement` findings.

---

## Steps

### 1. Draft the Decomposition

Follow `./specialist.md` with:

```text
task_context:
  parent_item: complete official parent item
  needs_refinement_findings: preserved refinement findings
```

Keep the selected specialist as sole author. It may inspect user- or
item-identified technical context read-only.

Have it load `../skills/to-tickets/SKILL.md` completely and run only Steps 1–3
through `Draft vertical slices`. Require a provider-neutral draft containing at
least two autonomous vertical slices that cover the parent scope exactly once.
Each child has a stable reference, meaningful title, and free-form Markdown
body that communicates:

- the observable outcome it delivers;
- the verifiable conditions under which it is complete;
- every parent constraint or exclusion that materially applies to it;
- every unresolved question that prevents an implementation decision, when
  applicable.

These are content requirements, not required Markdown headings. Return an
acyclic graph of only genuine blockers whose valid, non-self edges use:

```text
blocked_ref: stable reference of the child that waits
blocking_ref: stable reference of the child that must complete first
```

Tracker setup is not required for this draft-only invocation. Return the draft
to `/refine` before Step 4 of `to-tickets`; `/refine` owns confirmation and
provider operations.

### 2. Review the Decomposition

Verify the complete Step 1 contract. Return every deficiency and the complete
draft to the same specialist for revision, then repeat this step before any
preview.

### 3. Confirm the Decomposition

Present using `../templates/decomposition-preview.md` with:

```text
children: complete reviewed child proposals with stable references, titles, and bodies
blocking_edges: complete reviewed blocked_ref and blocking_ref pairs, or none
```

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
- `Cancel without changes`: finish according to
  `../goals/refine-complete.md` without mutation.
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
