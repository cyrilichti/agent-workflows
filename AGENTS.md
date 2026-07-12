# AGENTS.md

This project uses `.agents/` as its structured AI context directory.

## Global Rules

Follow `rules/default-language.md`.

## Session Bootstrap

At the beginning of a new work session, follow:

`.agents/rules/session-bootstrap.md`


## Sub-agents

Before any non-trivial work, follow `.agents/workflows/sub-agent.md`: choose a
matching profile, load it fully, consult referenced resources, then confirm
activation with the required announcement block.

Activation is the loading and consulting, not the announcement itself.

## Guidelines

- Load only the context required for the current task.
- Prefer existing workflows over inventing new ones.
- Reuse existing skills whenever possible.
- Follow project rules.
- Consult project documentation before making domain decisions.
- Produce outputs matching the appropriate template.
- Use available MCP tools when relevant.
