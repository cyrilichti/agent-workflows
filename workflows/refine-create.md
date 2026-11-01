# Refine Create

## Input

| Input | Requirement |
| --- | --- |
| `provider` | Resolved item provider |
| `parent_item` | Complete official parent item with provider ID and destination |
| `children` | Exact confirmed children in preview order, each with a stable reference, title, and body |
| `blocking_edges` | Exact confirmed `blocked_ref` and `blocking_ref` pairs, or none |

---

## Steps

### 1. Check Creation Prerequisites

Before the first provider mutation, require every input above. On a missing
input, report `stopped` under `../goals/refine-complete.md`.

### 2. Create Children

For each child in preview order, run `../commands/create-child-item.md` once
with:

```text
provider: resolved item provider
parent_item: complete official parent item with its provider ID and destination
child:
  title: exact confirmed child title
  body: exact confirmed child Markdown body
```

Map each result to its stable reference. Record failures and continue.

### 3. Apply Required Child Labels

When the official parent has the exact `agent-shaped` label, run
`../commands/apply-item-label.md` once for every
successfully created child in preview order with:

```text
provider: resolved item provider
item_id: created child provider ID
label: agent-shaped
```

Record each label result and continue on failure. Otherwise skip child labels.

### 4. Create Blocking Relations

Group confirmed `blocking_ref` values by `blocked_ref` and resolve them through
successful Step 2 results. For each group with a created blocked child and at
least one created blocker, run
`../commands/create-blocking-relations.md` once with:

```text
provider: resolved item provider
blocked_item_id: provider ID of the blocked child
blocking_item_ids:
  - provider ID of each successfully created blocking child
```

Record edges with missing endpoints and operation failures. Continue with
remaining groups.

### 5. Finish

After the first child creation call, do not stop for a child creation, required
label, or relation failure. Continue every operation whose prerequisites are
satisfied, then finish according to `../goals/refine-complete.md` using the
observed child, required label, and relation results.
