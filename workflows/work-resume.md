# Work Resume Branch

## Steps

### 1. Bind the Existing Request

Resolve the current checkout's push remote, then run
`../commands/resolve-version-provider.md` and
`../commands/resolve-version-repository.md` for that remote. Run
`../commands/resolve-request.md` with:

```text
provider: resolved version provider
repository: repository derived from the push remote
request_id: carried exact request ID, when supplied
request_backlinks: official item's existing delivery backlinks
source_branch: carried branch, when supplied
ambiguity_policy: stop
```

Require the returned source branch to be a nonempty valid Git branch name,
different from the repository's default branch. Preserve a supplied request
identity; stop on any contradictory backlink, request, or branch identity.
Do not search for or substitute another request.

### 2. Check Out the Source Branch Safely

Require a clean worktree and index, including no untracked files, before
switching. Verify the exact local source branch exists with
`git show-ref --verify refs/heads/<source_branch>`, then run
`git switch --no-guess <source_branch>`. Pass the validated branch as a separate
process argument. Stop on a missing branch or failed switch with the observed
error, before editing any file.

After switching, require the current branch to equal the request's source
branch, a clean worktree and index, and an upstream for that branch belonging
to the same push repository and exact source branch. Require the branch not
to be behind or diverged from its upstream. Stop on a failed check before
persisting corrective todos, todo states, or implementation changes.

### 3. Resume Delivery

Apply only Step 1 of `./work-initialize.md` to move the exact item to
`in progress`. Preserve the resulting official item, existing local plan,
source branch, and complete request record in the delivery context.
Return to shared execution.

## Safety

- Do not create a branch, plan, request, initialization commit, or backlink.
- Do not create or select another worktree, stash, reset, clean, force-switch,
  fetch, pull, merge, rebase, or push for initialization.
- Preserve caller identities and local files; report an unsafe checkout or
  stale branch instead of repairing it implicitly.
- Do not persist Git, provider, or request metadata in the plan.
