# Ready Execution Branch

## Steps

### 1. Verify the Delivery

Require the authoritative plan file, Objective, Expected Outcome, todos, and
global Validation. Derive its canonical reference from its project-relative
path. Every todo must be terminal and at least one must be `completed`.

Inspect the current branch without fetching. Require a clean named non-default
branch with an upstream that is not behind or diverged. Keep the branch, `HEAD`,
push remote, upstream, and ahead count.

Resolve the configured version provider, repository, and exact open request for
the current branch with `../commands/resolve-version-provider.md`,
`../commands/resolve-version-repository.md`, and
`../commands/resolve-request.md`. Reuse the request identity or official item
backlinks from the delivery context; ask for its number or IID only when neither
is available. Never search for or substitute another request.

Reset every checkbox in the plan's global Validation to unchecked, then run
every validation item regardless of its prior state. After each successful
item, check its exact checkbox. Never check a failed or unexecuted item, and do
not modify any other plan content.

Compare the complete committed diff against the request target with the
Objective and Expected Outcome. Check only that the planned outcome was
delivered: do not select a specialist or perform a code review.

For every validation failure or concrete delivery gap, create one
`delivery_context.source_findings` record defined by
`../templates/delivery-context.md` with `workflow: ready`, a stable finding ID,
its exact explanation, and the verified local HEAD SHA. Then follow `./work.md`
in resumed caller mode. Do not modify the plan in `/ready`.

### 2. Recheck and Push

Require the same branch and HEAD with a clean worktree. Restart verification if
they changed. Push normally to the configured upstream only when ahead, then
read the exact request with `fields: delivery_state` and require its head SHA to
equal the verified local HEAD.

### 3. Publish the Plan and Promote

Re-read the authoritative plan after validation. Use its exact complete content
as the request body,
without adding a wrapper, heading, marker, summary, or metadata. Update the
exact request description, then mark it ready through
`../commands/update-request.md`. Stop on any failed, unsupported, or unobserved
required mutation.

Read the exact request with `fields: delivery_state`. Require it to be open,
non-draft, and still at the verified HEAD before continuing.

Resolve the item provider and run `../commands/transition-item-status.md` with
`target_status: review` best-effort; this never blocks request promotion.

### 4. Continue to Inspect

Follow `./inspect.md` in caller mode with the complete delivery context and the
observed non-draft request. Do not ask another question.
