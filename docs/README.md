# my-agentic

Skills-aware workflows for AI engineering agents.

It is Skills-aware: specialized agents recognize the current context and use
the right managed or adopted Skills without handing control of the workflow to
them.

```text
Intent → Workflow → Specialized agent → Best-fit Skills
```

## One Entry Point per Intent

Each public command starts a clear workflow. The workflow keeps control of the
journey, activates expertise only when needed, and stops at explicit boundaries
instead of letting the agent improvise the process.

```text
/write → Create or reformulate an item
/pick  → Select an item
/plan  → Create an approved plan
```

## Explore

- [Workflows](./workflows/README.md) — understand the workflow model and browse
  the available entry points.
- [Skills](./skills.md) — understand how agents use managed and adopted Skills
  without giving them control of the workflow.
- [Installation](./installation.md) — add my-agentic to a project and restore
  its managed Skill dependencies.

