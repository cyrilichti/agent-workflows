# Workflows

This directory contains repeatable agent sessions installed under
`.agents/workflows/`.

A workflow owns sequencing, routing, approvals, and stopping boundaries. It
references commands, provider operations, agents, rules, goals, and templates
instead of duplicating them.

Keep specialist behavior in `../agents/`, reusable operations in
`../commands/`, and provider-specific execution in `../providers/`.

See the [workflow documentation](https://cyrilichti.github.io/agent-workflows/workflows/)
for behavior and usage.
