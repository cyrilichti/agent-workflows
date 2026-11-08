# Sandbox Complete

## Outcome

Preparation creates an isolated environment and returns a serializable sandbox
context. Teardown removes the resources owned by that context.

## Terminal Outcomes

- Prepared: return the command's context and end the workflow.
- Completed: teardown succeeded, including when resources were already absent.
- Stopped: return the exact failure stage and reason, preserving any allocated
  context for cleanup retry.
