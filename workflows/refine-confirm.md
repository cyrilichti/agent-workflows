# Refine Confirm Branch

## Entry Condition

Run from a context branch with a resolved provider, official parent item ID,
complete official parent item, and preserved `needs-refinement` findings.

---

## Steps

### 1. Resolve Decomposition Author

Follow `./sub-agent.md` with:

```text
task_context:
  parent_item: complete official parent item
  needs_refinement_findings: preserved refinement findings
```

Keep its selected specialist as the sole author. It may inspect user- or
item-identified technical context read-only.

### 2. Draft the Decomposition

Have the specialist load `../skills/to-tickets/SKILL.md` completely and run
only Steps 1–3 through `Draft vertical slices` with the parent item, findings,
and inspected context.

Require at least two provider-neutral children, each with a stable local
reference, meaningful title, free-form Markdown body, and genuine blockers
when applicable. They must be autonomous vertical slices covering the parent
scope exactly once. Edges may connect children but must not encode internal
implementation steps.

Return the provider-neutral draft to `/refine` before Step 4. `/refine` owns
user confirmation and all provider operations.

### 3. Review the Decomposition

Verify the Step 2 contract and that every edge references existing children
without self-reference, false blockers, or cycles. On failure, give the draft
and concise findings to the same specialist, then repeat this step. Do not use
another author for repairs.

### 4. Confirm the Decomposition

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

- `Adjust the decomposition`: give the adjustment and current draft to the
  same specialist, then repeat Step 3.
- `Cancel without changes`: finish according to
  `../goals/refine-complete.md` without mutation.
- `Confirm and create all child items`: preserve the exact latest preview and
  continue.

Do not support partial confirmation or mutate the provider before complete
confirmation.

### 5. Create Children

For each confirmed child in preview order, run
`../commands/create-child-item.md` once with:

```text
provider: resolved item provider
parent: complete official parent item with its provider ID and destination
content:
  title: exact confirmed child title
  body: exact confirmed child Markdown body
```

Map each result to its local reference. Record failures and continue without
retry, replacement, rollback, or unparented creation. Pass only confirmed
content and keep edges as workflow metadata for Step 6.

### 6. Create Blocking Relations

Resolve child references only through successful Step 5 results. For each
created child with confirmed blockers, run
`../commands/create-blocking-relations.md` once with:

```text
provider: resolved item provider
blocked_item_id: provider ID of the blocked child
blocking_item_ids:
  - provider ID of each successfully created blocking child
```

Record edges with a failed endpoint without a provider call. Record operation
failures and continue without retrying or removing successful relations.

### 7. Finish

Finish according to `../goals/refine-complete.md` using observed child and
relation results.
