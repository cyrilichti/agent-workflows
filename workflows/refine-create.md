# Refine Create Branch

## Entry Condition

Run only with a resolved provider, complete official parent item, and the exact
children and blocking edges from the latest confirmed preview.

---

## Steps

### 1. Require Creation Prerequisites

Before the first provider mutation, require the resolved provider, the official
parent ID and destination, every confirmed child's stable reference, title,
and body, and every confirmed blocking edge. Stop without creating any child
when one of these prerequisites is missing.

### 2. Create Children

For each child in preview order, run `../commands/create-child-item.md` once
with:

```text
provider: resolved item provider
parent: complete official parent item with its provider ID and destination
content:
  title: exact confirmed child title
  body: exact confirmed child Markdown body
```

Map results to local references. Record failures and continue without
replacement.

### 3. Apply Required Child Labels

Check whether the official parent item contains the exact `agent-shaped`
label. When it does, run `../commands/apply-item-label.md` once for every
successfully created child in preview order with:

```text
provider: resolved item provider
item_id: created child provider ID
label: agent-shaped
```

Record the label result against each child. Record failures and continue. When
the parent does not contain `agent-shaped`, do not run a label operation.

### 4. Create Blocking Relations

Group every confirmed `blocking_ref` by its `blocked_ref`, then resolve both
only through successful Step 2 results. For each group whose blocked child and
at least one blocking child were created, run
`../commands/create-blocking-relations.md` once with:

```text
provider: resolved item provider
blocked_item_id: provider ID of the blocked child
blocking_item_ids:
  - provider ID of each successfully created blocking child
```

Record every edge with a missing endpoint without a provider call. Do not call
the command when no blocker in the group was created. Record operation failures
and continue.

### 5. Finish

After the first child creation call, do not stop for a child creation, required
label, or relation failure. Continue every operation whose prerequisites are
satisfied, then finish according to `../goals/refine-complete.md` using the
observed child, required label, and relation results.
