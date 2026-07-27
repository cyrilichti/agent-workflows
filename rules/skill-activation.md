# Skill Activation

When a workflow or agent selects or replaces a Skill as a method for the
current task, the component that makes the routing decision must announce it
before the Skill is applied using `../templates/skill-activation.md`.

Announce the initial selection and every change, but do not repeat an unchanged
Skill.

This applies to mandatory workflow-scoped Skills and conditional or dynamic
Skill routing. It does not apply to thin workflow bridge Skills or fixed
profile resources because loading them does not involve a routing decision.

Only the routing owner announces the Skill. A caller and sub-agent must not
announce the same selection twice.
