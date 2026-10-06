# Work Complete

## Outcome

One authoritative plan is initialized when needed, executed autonomously, and
continued through `/ready`.

## Success Criteria

- Standalone work resumes when the official item contains a delivery backlink,
  preserving the referenced local plan and its todo states. Otherwise, it
  materializes the published plan locally before initialization.
- New work automatically switches the current checkout to the repository's
  default `main` or `master` branch and runs `git pull --ff-only`, preserving
  local changes and using no other worktree. Once the worktree and index are
  clean, it creates and pushes one work branch and empty initialization commit,
  creates one draft request, and adds its URL to the official item.
- Resumed work continues without branch or request recovery, another
  initialization commit, or another item backlink.
- Every entry moves the item to the exact resolved `in progress` status
  before initialization or implementation. An item already at that target
  continues without a status write; otherwise only its status is updated. The
  returned resulting status is preserved in the official item and delivery
  contexts according to `../rules/mutation-response.md`.
- No Git, provider, request, or status metadata is added to the plan.
- Every todo state transition is persisted immediately in the authoritative
  plan file.
- Every processed todo uses the active appropriate specialist and its routed
  Skills; selection runs again only when the required agent cohort changes.
- Initial and corrective todos execute without individual confirmation. A todo
  with staged tracked changes creates one non-empty commit; a todo without them
  completes without a commit.
- `/work` alone translates readiness gaps and blocking inspection findings into
  corrective todos with their source ID, HEAD SHA, and exact finding.
- Every non-empty todo commit is pushed immediately by `/work`; a todo without
  a commit does not trigger a push.
- A terminal plan with completed work hands `/ready` the same delivery context
  without another choice.
- A plan whose todos are all `cancelled` stops without calling `/ready`.

## Stop Conditions

- Stop successfully after handing completed work to `/ready` or when every todo
  is `cancelled`.
- Stop and report when a required operation fails or a precondition is not
  satisfied, including an unresolved or failed item activation before
  initialization or implementation.

## Human Validation

The selected plan and item, or caller-supplied context, authorize autonomous
execution. No todo commit or `/ready` handoff requires another choice.
