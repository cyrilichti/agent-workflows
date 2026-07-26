# Hooks

This directory contains project hooks for AI agents.

Hooks are event-driven automations executed when a specific event occurs during
an agent's execution.

Unlike workflows, which describe business processes, hooks react to lifecycle
events and automate repetitive actions.

---

## Purpose

Use hooks to:

* validate actions before execution;
* perform automatic checks;
* enforce project policies;
* trigger notifications;
* execute post-processing tasks;
* synchronize project resources.

Hooks help ensure consistent behavior across AI agents.

---

## What does NOT belong here

Do not store:

* business workflows (use `workflows/`);
* business knowledge (use `domain/`);
* reusable capabilities (use `skills/`);
* agent definitions (use `agents/`);
* project conventions (use `rules/`).

Hooks respond to events. They do not define project processes.

---

## Organization

Each hook should be described in its own Markdown document.

```text
hooks/
├── README.md
├── pre-tool-use.md
├── post-tool-use.md
├── stop.md
├── notification.md
└── ...
```

---

## Example

### `post-tool-use.md`

```markdown
# Post Tool Use

## Trigger

After an AI agent successfully executes a tool.

## Purpose

Perform project-specific actions after tool execution.

## Typical Actions

- Update project memory.
- Refresh generated artifacts.
- Validate generated files.
- Trigger notifications.
- Suggest follow-up actions.

## Stop Conditions

The hook completes successfully or reports an actionable error.
```

---

## Best Practices

* Hooks should perform a single responsibility.
* Keep hooks lightweight and deterministic.
* Avoid embedding business logic inside hooks.
* Prefer reusable hooks over project-specific implementations when possible.
* Document trigger conditions clearly.

---

## Compatibility

Many AI development environments support lifecycle hooks or similar mechanisms.

Examples include:

* Cursor
* OpenCode
* Custom agent orchestrators

Project hooks should remain implementation-agnostic whenever possible.

---

## References

* Cursor – Create Hook
  [https://docs.cursor.com/](https://docs.cursor.com/)

* AGENTS.md
  [https://agents.md/](https://agents.md/)

* .agents Protocol
  [dotagents-protocol]

[dotagents-protocol]:
  https://github.com/aj47/dotagentsprotocol-website
