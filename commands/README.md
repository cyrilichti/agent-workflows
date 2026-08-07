# Commands

Commands are reusable agent procedures.

A command centralizes a repeated operation so workflows and agents do not
duplicate the same instructions.

## Responsibilities

Use commands to:

- resolve project configuration;
- retrieve or prepare repeated context;
- check whether a provider or tool is available;
- keep common agent operations consistent.

## Boundaries

Commands are not full workflows. The caller decides when a command is needed and
what happens after it runs.

Keep commands focused, reusable, and free from task-specific decisions.

## Structure

A command should usually include:

- Purpose
- Input
- Steps
- Failure behavior when useful
