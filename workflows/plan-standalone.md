# Plan Standalone Branch

## Purpose

Resolve standalone planning context, then follow the shared execution.

---

## Required Context

Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Resolve Conversational Context

Use the current request and conversation when the objective, problem, and
expected outcome are known.

Otherwise, activate `../agents/item-writer.md` in `qualify` mode with the
current request, relevant conversation context, and only code, specifications,
files, or URLs identified by the user. Follow its qualification output until
it returns an understanding with the intended outcome, success conditions, and
no unresolved material question. Keep that understanding as transient task
context. Do not ask it to draft or persist a provider item.

### 2. Follow Shared Execution

Follow `./plan-confirm.md` with:

```text
task_context: complete conversational or transient item context
entry_mode: standalone
```
