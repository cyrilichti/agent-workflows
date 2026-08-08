# Work Standalone Branch

## Steps

### 1. Select the Plan

Select only files under `../plans/` whose names end with `.plan.md`. Sort them
by modification time from newest to oldest, keep at most the first 10, and ask
using `../templates/select-option.md` with:

```text
question: Which plan do you want to execute?
options:
- label: <readable plan name>
  value: <plan file path>
```

When no matching plan exists, report that no executable plan is available and
stop.

Read the selected plan. Do not create, rewrite, or approve a plan in this
workflow.

### 2. Resolve Work Mode

Set `work_mode` to `resumed` when the user explicitly asks to resume or the
selected plan contains an `in_progress` or `completed` todo. Otherwise, set it
to `new`.

Do not infer or update todo states from Git history or local changes.

### 3. Follow Shared Execution

Follow `./work-confirm.md` with:

```text
plan: selected plan
work_mode: resolved work mode
```
