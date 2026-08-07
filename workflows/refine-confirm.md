# Refine Confirm Branch

## Entry Condition

Run with a resolved provider, official parent item ID, complete official parent
item, and preserved `needs-refinement` findings.

---

## Steps

### 1. Draft the Decomposition

Follow `./sub-agent.md` with:

```text
task_context:
  parent_item: complete official parent item
  needs_refinement_findings: preserved refinement findings
```

Keep the selected specialist as sole author. It may inspect user- or
item-identified technical context read-only.

Have it load `../skills/to-tickets/SKILL.md` completely and run only Steps 1–3
through `Draft vertical slices`. Require at least two provider-neutral children
with stable references, meaningful titles, Markdown bodies, and genuine
blocking edges when applicable.

The children must be autonomous vertical slices covering the parent scope
exactly once. Return the draft to `/refine` before Step 4 of `to-tickets`;
`/refine` owns confirmation and provider operations.

### 2. Review the Decomposition

Verify the Step 1 contract and an acyclic blocking graph containing only valid,
non-self references and genuine blockers. Return failures with the complete
draft to the same specialist, then repeat this step.

### 3. Confirm the Decomposition

Present using `../templates/decomposition-preview.md` with:

```text
children: complete reviewed child proposals with stable references, titles, and bodies
blocking_edges: complete reviewed blocking edges, or none
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
