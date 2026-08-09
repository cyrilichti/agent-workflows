# Done

## Purpose

Merge one exact request when needed, then move its official item to the
resolved `done` state.

---

## Required Context

Load `../goals/done-complete.md` once as this workflow's completion contract.

Follow `../rules/user-facing-output.md`.

Follow `../rules/mutation-response.md`.

---

## Steps

### 1. Resolve the Official Item

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Preserve any exact item ID or title phrase supplied with the invocation as the
item hint. Run `../commands/select-review-item.md` with:

```text
provider: resolved item provider
reference: supplied exact provider item ID, when available
query: supplied title phrase, when no exact ID is available
```

### 2. Read the Official Item

Run `../commands/read-item.md` with:

```text
provider: resolved item provider
item_id: selected provider item ID
fields: request_backlinks
```

Use the returned item and provider ID as the complete official item context.

### 3. Follow Completion

Follow `./done-confirm.md` with:

```text
provider: resolved item provider
item: complete official item context
```

---

## Safety

- Never mutate before the single explicit confirmation.
- Never merge a Draft, blocked, unknown, changed-head, or substituted request.
- Never transition the item before the request is observed as merged.
- Never retry automatically or roll back a successful merge.
- Never modify code, commits, branches, request content, reviews, or item
  fields other than the resolved state.
- Never deploy, release, tag, or invoke another workflow.
