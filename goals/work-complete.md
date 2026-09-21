# Work Complete

## Outcome

One authoritative plan is initialized when needed, executed autonomously, and
continued through `/ready`.

## Success Criteria

- New work starts from a clean `main` or `master`, runs `git pull --ff-only`,
  then creates and pushes one work branch and empty initialization commit,
  creates one draft request, and adds its URL to the supplied official item
  when available.
- Resumed work continues without branch or request recovery, another
  initialization commit, or another item backlink.
- Item status remains unchanged and no Git, provider, or request metadata is
  added to the plan.
- Every todo state transition is persisted immediately in the authoritative
  plan file.
- Every processed todo uses the active appropriate specialist and its routed
  Skills; selection runs again only when the required agent cohort changes.
- Initial and corrective todos execute without individual confirmation. A todo
  with staged tracked changes creates one non-empty commit; a todo without them
  completes without a commit.
- `/work` alone translates readiness gaps and blocking inspection findings into
  corrective todos with their source ID, HEAD SHA, and exact finding.
- Todo commits are not pushed by `/work`.
- A terminal plan with completed work hands `/ready` the same delivery context
  without another choice.
- A plan whose todos are all `cancelled` stops without calling `/ready`.

## Stop Conditions

- Stop successfully after handing completed work to `/ready` or when every todo
  is `cancelled`.
- Stop and report when a required operation fails or a precondition is not
  satisfied.

## Human Validation

The selected or caller-supplied plan authorizes autonomous execution. No todo
commit or `/ready` handoff requires another choice.
