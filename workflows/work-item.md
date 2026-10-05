# Work Item Branch

## Steps

### 1. Preserve Context

Preserve the supplied plan and complete official item context unchanged. Do
not rediscover, rewrite, or approve the plan and do not reread the item.
`/pick` has already moved the official item to its active status before
calling `/work`.

Require the official item to contain the exact `agent-planned` label.

### 2. Follow Shared Execution

Use the caller's `work_mode` when it is `resumed`; otherwise use `new`.

Follow `./work-confirm.md` with:

```text
plan: approved plan
item: complete official item context
delivery_context: supplied delivery context, when available
work_mode: resolved work mode
```
