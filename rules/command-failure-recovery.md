# Command Failure Recovery

- On command failure, inspect its `stage`, `reason`, completed identities,
  and current state before retrying.
- Correct the cause within the approved scope and resume the failed step,
  preserving completed effects and reusing existing item, branch, and request
  identities. Retry a mutation only after checking whether it took effect.
- Stop when external intervention is required or the same error persists
  after correction. Report the failed step, cause, completed effects, and
  required intervention. An identical retry without correction is not recovery.
