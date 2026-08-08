# Ready Confirm Branch

## Steps

### 1. Verify

Require the plan's `planId`, Objective, Expected Outcome, todos, and global
Validation. Every todo must be terminal and at least one must be `completed`.

Inspect the current branch without fetching. Require a clean named non-default
branch with an upstream that is not behind or diverged. Keep the branch, `HEAD`,
push remote, upstream, and ahead count.

Resolve the configured version provider, repository, and exact open request for
the current branch with `../commands/resolve-version-provider.md`,
`../commands/resolve-version-repository.md`, and
`../commands/resolve-request.md`. Use the supplied request ID or ask for it;
never search for or substitute another request.

Run only the plan's global Validation. Compare the complete committed diff
against the request target with the Objective and Expected Outcome. Check only
that the planned outcome was delivered: do not select a specialist or perform
a code review.

Return validation failures or concrete gaps to `/work`; otherwise continue.

### 2. Propose

Prepare the request body internally with
`../templates/request-description.md`. Present
`../templates/ready-preflight.md`, then ask once:

```text
question: Promote this work for review?
options:
- Confirm promotion
- Stop without changes
```

On `Stop without changes`, stop without mutation.

### 3. Promote

Require the same branch and `HEAD` with a clean worktree. This single final
guard also catches state changed by validation. If it fails, restart
verification and require a new confirmation.

Push normally to the configured upstream only when ahead. Update the exact
request description, then mark it ready using
`../commands/update-request.md`. Stop on failure with achieved and remaining
actions.

When official item context is available, resolve its provider and run
`../commands/transition-item-status.md` with `target_status: review`
best-effort; this never blocks request promotion.

Present `../templates/ready-result.md` from the mutation results and stop.

## Safety

- Do not mutate before confirmation.
- Do not modify work, force-push, merge, add checks, or invoke `/review`.
- Keep work gaps in `/work` and operational failures in `/ready`.
