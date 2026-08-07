# Refine Create Branch

## Entry Condition

Run only with a resolved provider, complete official parent item, and the exact
children and blocking edges from the latest confirmed preview.

---

## Steps

### 1. Create Children

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
replacement or rollback.

### 2. Create Blocking Relations

Group every confirmed `blocking_ref` by its `blocked_ref`, then resolve both
only through successful Step 1 results. For each group whose blocked child and
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
and continue without removing successful relations.

### 3. Finish

Finish according to `../goals/refine-complete.md` using observed child and
relation results.
