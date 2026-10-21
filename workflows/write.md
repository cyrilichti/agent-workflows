# Write

## Purpose

Create or reformulate exactly one provider-backed item.

---

## Required Context

Reuse any rules already active from the caller. From this workflow's directory,
load the remaining rules in one `cat` command, omitting paths for active rules.
Skip the command when all are active:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Load `../goals/write-complete.md` once as this workflow's completion contract.

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

### 2. Follow One Mode Branch

Follow exactly one branch:

- for inferred `create` or `Create a new item`, follow `./write-create.md`;
- for inferred `update` or `Reformulate an existing item`, follow
  `./write-update.md`.

Pass the preserved initial intention to the selected branch when available.
