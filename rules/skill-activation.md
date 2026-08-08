# Skill Activation

When a workflow or agent selects or replaces a Skill as a method for the
current task, the routing owner must announce it before applying it using
`../templates/skill-activation.md`. This is an exception to keeping successful
orchestration internal.

Announce the initial selection and every change; do not repeat an unchanged
Skill. Applies to mandatory workflow-scoped Skills and conditional or dynamic
routing. Does not apply to thin workflow bridge Skills or fixed profile
resources that are not Skills. Callers and sub-agents must not re-announce the
same selection.
