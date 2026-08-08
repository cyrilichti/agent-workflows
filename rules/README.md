# Rules

This directory contains permanent constraints and engineering conventions
installed under `.agents/rules/`.

Keep one concise topic per file. Rules define what must be respected; procedures
belong in `../workflows/`, history in `../memory/`, and output shapes in
`../templates/`.

## Loading

Rules are contextual and are not loaded by default.

Load a rule only when the current task explicitly needs its constraint.

Reference specific files from an agent, Skill, workflow, scoped IDE rule, or
explicit user request. Reserve global loading for genuine invariants.
