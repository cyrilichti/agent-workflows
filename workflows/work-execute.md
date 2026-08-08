# Work Execute Branch

## Steps

### 1. Execute Todos

Treat plan todo states as authoritative. Skip `completed` and `cancelled`, then
select the single `in_progress` todo or mark the first `pending` todo
`in_progress`. Continue to Step 2 when neither exists.

For each active todo:

1. Follow `./sub-agent.md` with:

   ```text
   task_context:
     todo: active todo
     constraints: relevant plan constraints
     technical_context: required technical context
   ```

   Reevaluate the specialist for every todo and let it route the appropriate
   Skills.
2. Have the specialist implement and validate only that todo, then stage only
   its changes.
3. Present `../templates/todo-review.md`, then
   `../templates/commit-proposal.md` with one proposed title and description.
4. Ask using `../templates/select-option.md` with:

   ```text
   question: What do you want to do with this commit proposal?
   options:
   - Commit these changes
   - Request an adjustment
   ```

5. On `Request an adjustment`, collect the free-form adjustment and return it
   to the same specialist. Repeat implementation, validation, staging, review,
   and proposal.
6. On `Commit these changes`, create the approved commit without trailers.
   After it succeeds, mark the todo `completed` without pushing, then continue
   with the next todo.

### 2. Run Global Validation

Run every applicable check in the plan's global Validation, using inspection
for an explicitly manual item. On failure, report actionable findings and stop
without pushing.

### 3. Offer Ready

On success, ask using `../templates/select-option.md` with:

```text
question: What do you want to do with this validated work?
options:
- Prepare work for review
- Stop here
```

On `Stop here`, report that validation succeeded and stop without mutation.

On `Prepare work for review`, follow `./ready.md` in caller mode with:

```text
plan: authoritative plan
item: complete official item context, when available
request_id: created request ID, when available
```

When resumed work has no request ID, `/ready` asks for its number or IID. It
owns confirmation and every resulting push or provider mutation.

---

## Safety

- Do not mark a todo `completed` before its approved commit succeeds.
- Do not push todo commits or invoke `/review`.
