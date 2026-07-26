---
name: agent-workflows
description: >-
  Initialize or update the agent-workflows module in a consuming Git
  repository. Use only when explicitly invoked with `/agent-workflows` or
  `$agent-workflows` to create the agent entry points, restore managed Skill
  dependencies, configure ClickUp or Linear, or update the `.agents`
  submodule.
disable-model-invocation: true
---

# Agent Workflows

Manage an existing agent-workflows submodule from the consuming repository
root.

## Resolve Operation

Resolve the operation from the consuming project:

- When `AGENTS.md`, `.cursor`, and `skills-lock.json` are all absent, initialize
  the newly added `.agents` submodule.
- When at least one of these entry points is an expected symlink and every
  existing entry point has the expected type and target, update the existing
  installation and restore any missing entry point.
- When any entry point exists with another type or target, stop and report the
  conflict without replacing it.

Do not ask the user to choose between initialization and update.

## Preflight

Before any mutation:

1. Work from the consuming repository root.
2. Verify that Git, Node.js are available.
3. Verify that `.agents` exists and is registered as the `agent-workflows`
   Git submodule.
4. Stop with an actionable error when a required prerequisite is missing.
5. Do not create commits.

## Initialize

Tell the user that initialization will:

- expose the shared agent instructions through `AGENTS.md`;
- expose the Cursor configuration through `.cursor`;
- expose the managed dependency map through `skills-lock.json`;
- restore the managed Skill dependencies;
- create the provider configuration.

Then perform the following steps in order.

### 1. Sync Entry Points

For each entry point, accept an existing symlink only when it already resolves
to the expected target. Create it when absent. Stop without replacing it when
the path exists with any other type or target.

```bash
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/skills-lock.json skills-lock.json
ln -s .agents/.cursor .cursor
```

### 2. Install Dependencies

Run:

```bash
npx skills experimental_install
```

Stop and report the command output when dependency installation fails.

### 3. Configure Item Provider

Ask the user using `.agents/templates/select-option.md` with:

```text
question: Which ticket provider does this project use?
options:
- label: ClickUp
  value: clickup
- label: Linear
  value: linear
```

When `agentic.yaml` is absent, create it from the example:

```bash
cp .agents/agentic.example.yaml agentic.yaml
```

Set only `mcp.item.provider` to the selected option value.

When `agentic.yaml` already exists, preserve every other setting and update only
`mcp.item.provider`.

## Update

Tell the user that the update will advance the `.agents` submodule, verify the
entry points, restore the managed Skill dependencies, and preserve the current
provider configuration.

Then:

1. Run `git submodule update --remote .agents`.
2. Apply the entry-point synchronization rules from initialization.
3. Run `npx skills experimental_install`.
4. Preserve a valid `agentic.yaml`.
5. When `agentic.yaml` is missing or has no supported `mcp.item.provider`, run
   the provider selection step from initialization.
6. Report the previous and current `.agents` commits without committing the
   parent repository.

## Validate

Before reporting success, verify:

- `AGENTS.md` resolves to `.agents/AGENTS.md`;
- `skills-lock.json` resolves to `.agents/skills-lock.json`;
- `.cursor` resolves to `.agents/.cursor`;
- every Skill declared in `.agents/skills-lock.json` exists under
  `.agents/skills/`;
- `agentic.yaml` contains either `clickup` or `linear` at
  `mcp.item.provider`.

Report which operation completed, the `.agents` commit, the configured
provider, and any files the user may want to stage.
