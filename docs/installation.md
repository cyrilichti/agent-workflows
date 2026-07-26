---
title: Installation
description: Add agent-workflows to a project, expose compatible entry points, and install its managed skills.
---

Install agent-workflows from the root of the project that will use it.

## 1. Add the submodule

Add the repository under `.agents/`. The submodule keeps agent-workflows
versioned independently while making its workflows, rules, templates, and local
skills available to the project.

```bash
git submodule add https://github.com/cyrilichti/agent-workflows.git .agents
```

The `.agents/` directory is the canonical source for everything provided by
agent-workflows.

## 2. Normalize the entry points

AI coding tools discover project instructions and integrations through
different conventional paths. Create symlinks at the project root so every tool
reaches the same files without duplicating them:

```bash
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/CLAUDE.md CLAUDE.md
ln -s .agents/.cursor .cursor
ln -s .agents/skills-lock.json skills-lock.json
```

These links provide compatible entry points for agents, Claude, Cursor, and the
Skills CLI while `.agents/` remains the single source of truth.

## 3. Install the skills

Restore the external skill dependencies recorded in `skills-lock.json`:

```bash
npx skills experimental_install
```

The command reads the lockfile exposed at the project root and installs the
managed dependencies into `.agents/skills/`. Their source and updates remain
owned by their upstream projects.

agent-workflows continues to own the execution flow. Installed skills provide
the specialized capabilities activated by those workflows.

## 4. Configure providers

Create the project configuration from the provided example:

```bash
cp .agents/agentic.example.yaml agentic.yaml
```

Then select the data provider used by the workflows.

[Configure providers →](/providers/)
