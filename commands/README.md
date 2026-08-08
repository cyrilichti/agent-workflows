# Commands

This directory contains reusable agent procedures installed under
`.agents/commands/`.

Each command owns one repeated operation, such as resolving configuration,
retrieving context, or preparing a provider call.

Commands do not orchestrate complete sessions or make task-specific decisions.
The calling workflow decides when to run them and what follows.

See the [documentation](https://cyrilichti.github.io/agent-workflows/) for
project usage.
