# Mutation Response

- Commands keep no hidden cache. Reuse successful command results only within
  the current workflow run.
- After mutation, use the mutation response first, then still-valid carried
  state. Replace only fields affected by the mutation.
- Read once only when a required field is missing or ambiguous. Otherwise use
  `Unavailable` for that field.
- Do not substitute the mutation response for an independently observed
  postcondition when the caller requires one.
