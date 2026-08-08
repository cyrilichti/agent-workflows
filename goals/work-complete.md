# Work Complete

## Outcome

One authoritative plan is initialized when needed, executed through approved
todo commits, globally validated, and handed to `/ready`.

## Success Criteria

- New work creates and pushes one work branch and empty initialization commit,
  creates one draft request, and adds its URL to the supplied official item
  when available.
- Resumed work continues without branch or request recovery, another
  initialization commit, or another item backlink.
- Item status remains unchanged and no execution metadata is added to the
  plan.
- Every processed todo uses a freshly evaluated specialist and its routed
  Skills.
- Every todo commit is explicitly approved before creation and marks its todo
  `completed` only after the commit succeeds.
- Todo commits are not pushed by `/work`.
- Global Validation runs after all todos become terminal.
- Successful validation calls `/ready` with the same plan, optional official
  item, and known request ID.

## Stop Conditions

- Stop successfully after handing validated completed work to `/ready`.
- Stop without pushing when global validation fails.
- Stop and report when a required operation fails or a precondition is not
  satisfied.

## Human Validation

Every todo commit requires the explicit approval defined by the workflow.
`/ready` owns approval for the final push and request promotion.
