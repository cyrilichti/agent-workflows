# Ready Standalone Branch

## Steps

### 1. Select the Plan

Select only files under `../plans/` whose names end with `.plan.md`. Sort them
by modification time from newest to oldest, keep at most the first 10, and ask
using `../templates/select-option.md` with:

```text
question: Which plan do you want to prepare for review?
options:
- label: <readable plan name>
  value: <plan file path>
```

When no matching plan exists, report that no ready plan is available and stop.
Read the selected plan without modifying it.

### 2. Follow Shared Readiness

Follow `./ready-confirm.md` with:

```text
plan: selected plan
```
