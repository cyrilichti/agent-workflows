# Workflows

Workflows define how agents should run repeatable work sessions.

A workflow orchestrates steps. It does not define specialist behavior, provider
API details, reusable commands, output formats, or project knowledge.

## Responsibilities

Use workflows to:

- route or sequence a task;
- call commands when an operation is reusable;
- call providers through commands, not directly;
- activate sub-agents when specialist behavior is needed;
- stop at clear boundaries.

## Boundaries

Workflows should reference existing resources instead of duplicating their
instructions.

Keep project-specific knowledge in the consuming project documentation.

## Structure

A workflow should usually include:

- Purpose
- Entry condition
- Steps
- Safety
- Success criteria when useful

Keep workflows short, explicit, and stable. Reference existing resources instead
of duplicating their instructions.
