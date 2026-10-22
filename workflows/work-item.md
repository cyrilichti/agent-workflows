# Work Item Branch

## Steps

### 1. Preserve Context

Require an approved plan and complete `agent-planned` official item context.
For resumed caller mode, also require a complete delivery context as defined by
`../templates/delivery-context.md`. Report missing inputs and stop without
switching to standalone mode.

Preserve the supplied plan and complete official item context unchanged. Do
not rediscover, rewrite, or approve the plan and do not reread the item.

### 2. Follow Shared Execution

Follow `./work-confirm.md` with:

```text
plan: approved plan
item: complete official item context
delivery_context: supplied delivery context, when available
work_mode: work mode supplied by `/work`
```
