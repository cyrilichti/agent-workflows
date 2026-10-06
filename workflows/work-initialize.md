# Work Initialize Branch

## Steps

### 1. Prepare the Base Branch

Use the current checkout. Resolve the repository's default branch and require
its name to be exactly `main` or `master`.

Run `git switch <default_branch>`, then `git pull --ff-only` on that branch.
Perform the switch automatically; do not ask the user to switch or stop merely
because another branch is current or local changes are present. Preserve local
changes and let Git reject an unsafe switch or pull.

Stop on a failed switch or pull with its observed error. After both succeed,
require a clean worktree and index before creating the work branch. If local
changes remain, report them and stop without discarding them.

### 2. Initialize the Branch

Format the branch name with `../templates/branch-name.md` using:

```text
plan_name: exact plan name
plan_objective: exact plan Objective
item_type: official item type, when available
```

Create and switch to the branch, create one empty initialization commit named
from the plan, then push to the current push remote.

### 3. Create the Draft Request

Run `../commands/resolve-version-provider.md`, then
`../commands/resolve-version-repository.md` with:

```text
provider: resolved version provider
push_remote: current push remote
```

Format the title with `../templates/request-title.md` using:

```text
plan_name: exact plan name
item_id: official item ID
```

Run `../commands/create-request.md` with:

```text
provider: resolved version provider
repository: repository derived from the push remote
source_branch: created work branch
target_branch: default branch used for initialization
title: formatted draft request title
```

Keep the complete created request record in the current execution context.

### 4. Link the Official Item

Run `../commands/link-request-to-item.md` with:

```text
provider: item provider from the official item context
item_id: official item ID
request_kind: created request kind
request_url: created request URL
plan_reference: project-relative authoritative plan file path
```

Return the created branch and complete request record for the delivery context.

---

## Safety

- Do not create or select another worktree, including as a fallback for local
  changes, a checked-out base branch, or a failed switch or pull.
- Do not stash, reset, clean, or force a branch switch.
- Do not fetch separately, merge, rebase, or use another pull mode.
- Do not run a general repository, provider, MCP capability, or backlink
  preflight.
- Link only the newly created request and do not change item status.
- Do not persist Git, provider, or request metadata in the plan.
