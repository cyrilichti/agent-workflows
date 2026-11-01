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
input, report `stopped` without creating a child.

### 2. Create Children

For each child in preview order, run from this file's directory:

```sh
node ../commands/save-item.ts <<'JSON'
{"mode":"create","title":"<confirmed child title>","body":"<confirmed child Markdown body>","parent_item_id":"<official parent ID>","destination":<parent destination JSON>}
JSON
```

For Linear, pass `destination` as `{"team":"<parent team ID>",
"project":"<parent project ID>"}` and omit `project` when absent. For
ClickUp, pass the parent's List ID as `destination`. Map each `saved` result
to its stable child reference, including its `item_id`, `item_reference`,
title, and URL. Record failures and continue.

### 3. Apply Required Child Labels

When the official parent has the exact `agent-shaped` label, run from this
file's directory once for every created child in preview order:

```sh
node ../commands/apply-item-label.ts <<'JSON'
{"item_id":"<created child item_reference>","label":"agent-shaped"}
JSON
```

Record each label result and continue on failure. Otherwise skip child labels.

### 4. Create Blocking Relations

Group confirmed `blocking_ref` values by `blocked_ref` and resolve them through
successful Step 2 results. For each group with a created blocked child and at
least one created blocker, run from this file's directory:

```sh
node ../commands/create-blocking-relations.ts <<'JSON'
{"blocked_item_ref":"<created blocked child item_reference>","blocking_item_refs":["<created blocker item_reference>"]}
JSON
```

Pass every created blocker reference in the group. Record created and failed
relations, and edges with missing endpoints. Continue with remaining groups.

### 5. Finish

After the first child creation call, do not stop for a child creation, required
label, or relation failure. Continue every operation whose prerequisites are
satisfied, then report the observed child, required label, and relation results.
