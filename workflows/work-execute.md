# Work Execute Branch

## Steps

### 1. Persist Corrective Todos

When the delivery context contains `source_findings`, translate each finding
through `../templates/corrective-todo.md` and append it to the authoritative
plan. Persist the plan before clearing the carried findings. `/ready` and
`/inspect` never modify the plan.

### 2. Execute Todos

Treat plan todo states as authoritative. Skip `completed` and `cancelled`, then
select the first `in_progress` todo or mark the first `pending` todo
`in_progress`. Continue to Step 3 when neither exists.

Persist every state transition immediately in the authoritative plan file. Do
not keep todo state only in execution context.

For each active todo:

1. Require a clean worktree and index before implementation.
2. Reuse the active specialist while it remains appropriate. When none is
   active or the todo requires a different agent cohort, follow
   `./specialist.md` with:

   ```text
   task_context:
     todo: active todo
     constraints: relevant plan constraints
     technical_context: required technical context
   ```

   Let the selected specialist route only Skills whose profile triggers apply,
   or work directly when none apply.
3. Have the specialist implement and validate only that todo, then stage only
   its changes.
4. When the index has no staged tracked change, persist the todo as `completed`
   without a commit and continue.
5. Otherwise, create one non-empty Conventional Commit without trailers. After
   success, persist the todo as `completed` without pushing and continue.

### 3. Continue to Ready

When no todo remains `pending` or `in_progress`, require at least one
`completed` todo. When all todos are `cancelled`, report that no work was
completed and stop without calling `/ready`.

Otherwise, follow `./ready.md` in caller mode without another choice:

```text
plan: authoritative plan
item: complete official item context
request_id: created request ID, when available
delivery_context: current delivery context
```

When resumed standalone work has no request ID, `/ready` owns its exact initial
context selection and then continues autonomously.

---

## Safety

- Do not mark a todo with staged changes `completed` before its commit succeeds.
- Never use `--allow-empty` for a todo commit.
- Do not push todo commits or invoke `/inspect` before `/ready` passes.
