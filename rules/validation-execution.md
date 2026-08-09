# Validation Execution

- Run a project validation command only when an applicable instruction
  explicitly requires it or the user explicitly requests it.
- Otherwise, do not propose, request, infer, or run one.
- Run only what was required or requested. Do not add related commands, setup,
  variants, retries, wrappers, or extra checks.
- Read-only inspection is not validation execution.
