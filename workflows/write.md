# Write

## Purpose

Create or reformulate exactly one provider-backed item.

---

## Required Context

Load `../goals/write-complete.md` once as this workflow's completion contract.

Follow `../rules/user-facing-output.md`.

Follow `../rules/mutation-response.md`.

---

## Steps

### 1. Resolve Authoring Mode and Intention

Use the conversational context available when the workflow is activated as the
source of the initial authoring intention. Reuse it when it contains
substantive need or revision context.

Infer `create` when the request unambiguously asks to write, draft, or create a
new item. Infer `update` when it explicitly asks to update, rewrite, or
reformulate an existing item. Do not display a mode selection after either
reliable inference.

For a bare `/write` invocation or a genuinely ambiguous request, ask using
`../templates/select-option.md` with:

```text
question: What do you want to write?
options:
- Create a new item
- Reformulate an existing item
```

Do not resolve the item provider before the mode is resolved. Keep the prefix
through playbook entry and any required mode choice free of provider
resolution.

### 2. Follow One Mode Branch

Follow exactly one branch:

- for inferred `create` or `Create a new item`, follow `./write-create.md`;
- for inferred `update` or `Reformulate an existing item`, follow
  `./write-update.md`.

Pass the preserved initial intention to the selected branch when available.

---

## Safety

- Do not create a plan, change item status, or start implementation.
