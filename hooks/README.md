# Hooks

This directory contains event-driven agent automations installed under
`.agents/hooks/`.

Each hook reacts to one documented lifecycle event and should remain focused,
lightweight, deterministic, and implementation-agnostic when possible.

Hooks may validate or post-process an action, but must not define complete
workflows, reusable capabilities, or project knowledge.
