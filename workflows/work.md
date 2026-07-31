# Work

## Purpose

Execute one selected plan incrementally on a dedicated branch and draft merge
request.

This workflow initializes new work once, resumes existing work without
rediscovery, and leaves item status ownership to the calling workflow.

---

## Entry Condition

Run this workflow in one of these modes:

- **Caller mode**: another workflow provides an approved plan and, when
  available, the active official item context.
- **Standalone mode**: `./play-book.md` selects `work`, or the `work` Skill is
  explicitly invoked without a calling workflow.

Caller mode from `./pick.md` is new work. `/pick` has already moved the official
item to its active status before calling `/work`.

Treat standalone execution as resumed work when the user explicitly asks to
resume or the selected plan already contains an `in_progress` or `completed`
todo. Otherwise, treat it as new work.

---

## Steps

### 1. Select the Plan

In caller mode, use the approved plan supplied by the caller. Preserve the
official item context when provided.

In standalone mode, select only files under `../plans/` whose names end with
`.plan.md`. Sort them by modification time from newest to oldest, keep at most
the first 10, and ask the user to select exactly one using
`../templates/select-option.md`. Use readable plan names as labels and plan
file paths as internal values.

When no matching plan exists, report that no executable plan is
available and stop.

Read the selected plan and require its existing `planId` and todo states. Do not
create, rewrite, or approve a plan in this workflow.

### 2. Resume Existing Work

For resumed work, trust that the current branch is the correct work branch and
that its draft merge request already exists.

Do not:

- switch or create a branch;
- search for, read, recover, or recreate the merge request;
- create another initialization commit;
- push for initialization;
- add another item backlink.

Continue directly with todo execution using the states stored in the selected
plan. Do not infer or update todo states from Git history or local changes.

### 3. Require the Default Branch for New Work

For new work, read the current branch and the locally known remote default
branch. Do not fetch or contact the remote merely to verify them.

If the current branch is not the locally known default branch, ask the user to
switch to the default branch and ensure it is up to date, then stop.

Compare the default branch with its locally known upstream. If it is known to
be behind or diverged, ask the user to update it, then stop. If local Git cannot
identify the default branch or its upstream state, ask the user to confirm the
default branch and that it is up to date before continuing.

Do not run a general repository, provider, MCP capability, or
backlink preflight.

### 4. Initialize New Work

After the user is on the locally known default branch and it is up to date:

1. Build the work branch name:
   - format it with `../templates/branch-name.md`;
   - use the official item type when available, otherwise derive the branch
     type from the plan objective;
   - include the official item ID when one is present.
2. Create and switch to that branch.
3. Create one empty initialization commit with a concise title derived from the
   plan name.
4. Push the branch to the current push remote.
5. Resolve the configured version provider by running
   `../commands/resolve-version-provider.md`.
6. Resolve the version-control repository from the push remote only when
   preparing the request creation.
7. Format the title with `../templates/request-title.md`.
8. Create the draft merge request by running `../commands/create-request.md`
   with:

   ```text
   provider: resolved version provider
   repository: repository derived from the push remote
   source_branch: created work branch
   target_branch: default branch used for initialization
   title: formatted draft request title
   ```

9. When caller mode supplied an official item, resolve its configured item
   provider and run `../commands/link-request-to-item.md` with the new merge
   request URL. Do not update the item status.

Resolve each provider or repository only when the corresponding operation
needs it. Do not persist the branch, remote, repository, provider, or merge
request in the plan.

### 5. Execute the Todo Loop

Treat the todo states stored in the plan as authoritative.

Repeat the following steps:

1. Skip todos already marked `completed` or `cancelled`. Select the single
   `in_progress` todo when one exists. Otherwise, select the first `pending`
   todo and mark it `in_progress`.
2. Select the most appropriate specialist for that todo by following
   `./sub-agent.md`. Reevaluate the selection for every todo, even when the
   previous specialist may still be suitable.
3. Give the specialist the active todo, relevant plan constraints, and required
   technical context. Let the specialist route the Skills appropriate to that
   todo.
4. Let the specialist implement and validate only the active todo.
5. Stage only the changes belonging to the active todo.
6. Present the todo with `../templates/todo-review.md`.
7. Immediately present one title and description with
   `../templates/commit-proposal.md`.
8. Ask the user through `../templates/select-option.md` with:

   ```text
   question: What do you want to do with this commit proposal?
   options:
   - label: Commit these changes
     value: commit
   - label: Request an adjustment
     value: adjust
   ```

9. On `adjust`, ask what should change and wait for the user's free-form
   response. Give that requested adjustment to the same specialist, then repeat
   implementation, validation, staging, todo review, and commit proposal.
10. On `commit`, create the commit with the approved title and description and
    no trailers.
11. Only after the commit succeeds, mark the active todo `completed`.
12. Do not push the todo commit. Pushing remains the user's responsibility.
13. Select the next todo and repeat. Leave the loop when no `in_progress` or
    `pending` todo remains.

### 6. Run Global Validation and Stop

When no todo remains `pending` or `in_progress`, run the global validation
defined in the selected plan.

Report the validation result and stop. Do not push commits.

---

## Safety

- Do not change item status.
- Do not fetch, pull, or update the default branch for the user.
- Do not initialize work until the user is on the default branch and it is up
  to date.
- Do not perform new-work initialization during resumed work.
- Add an item backlink only after creating a new merge request.
- Do not persist execution metadata in the plan.
- Stage only changes belonging to the active todo.
- Do not mark a todo `completed` before its approved commit succeeds.
- Do not push todo commits.
- Do not push after global validation.

---

## Success Criteria

This workflow entry, initialization, and todo loop satisfy their contracts
when:

- one existing plan has been selected or supplied;
- resumed work has continued without branch or merge-request recovery; or
- new work has created and pushed its branch and empty initialization commit,
  created one draft merge request, and added its URL to the supplied official
  item when present;
- item status has not been changed;
- no execution metadata has been added to the plan;
- each processed todo used a freshly evaluated specialist and its routed
  Skills;
- adjustment returned to the same todo and specialist;
- every created todo commit was explicitly approved before creation;
- each successful todo commit immediately marked its todo `completed`;
- no todo commit was pushed by `/work`;
- when no todo remained `pending` or `in_progress`, the global validation
  defined in the plan ran and `/work` stopped without pushing.
