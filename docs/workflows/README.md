# Workflows

Workflows are the public entry points of my-agentic. Each one owns a complete
user journey: the steps, choices, confirmations, provider operations, and
handoffs to the next workflow.

They are not generic prompts. A workflow keeps the process predictable while
specialized agents and external Skills provide the expertise needed at each
stage.

```text
User intent → Workflow orchestration → Specialized expertise → Clear outcome
```

## Available Workflows

### [`/write`](./write.md)

Create or reformulate one backlog item, confirm its content, save it, and choose
how it should be assigned.

### [`/pick`](./pick.md)

Select a startable backlog item, present its context, create an approved plan,
move the item to in progress, and hand it to `/work`.

### `/plan`

Create and approve an implementation plan. It can run independently or return
to the workflow that called it.

## Lifecycle

The complete lifecycle is designed around small workflows with explicit
handoffs:

```text
/write

/pick → /plan → /work → /ready → /review → /done
```
