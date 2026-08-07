# Plan Standalone Branch

## Purpose

Resolve standalone planning context, then follow the shared execution.

---

## Required Context

Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Resolve Conversational Context

Use the current request and conversation when they provide:

- objective: what must be achieved;
- problem: what must be solved and why it matters;
- expected outcome: how success will be recognized.

Otherwise, activate `../agents/item-writer.md`. Give it the current request,
relevant conversation context, and only code, specifications, files, or URLs
identified by the user.

Have it return one lightweight item using `../templates/item.md` with:

```text
title: meaningful item title
body: free-form Markdown containing the objective, problem, and expected outcome
```

Keep the returned item as transient task context.

### 2. Create Plan Identity

Generate one `plan:<uuid-v4>`.

### 3. Follow Shared Execution

Follow `./plan-confirm.md` with:

```text
task_context: complete conversational or transient item context
plan_id: generated plan identity
entry_mode: standalone
```
