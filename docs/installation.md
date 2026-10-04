---
title: Installation
description: Add Agent Workflows to a project.
---

From the project root, install the Agent Workflows bootstrap Skill:

```bash
npx skills add cyrilichti/agent-workflows --skill agent-workflows
```

Then invoke it explicitly from your agent:

```text
/agent-workflows
```

The same command installs a new project or updates an existing installation.

## Managed project content

Run the bootstrap from the project root with no pending Git changes. The files
created by the `npx skills add` command above are the only exception.

Installation and updates replace the root `AGENTS.md` and the Agent Workflows
sources under `.agents/`. Review the resulting Git diff if you keep local
customizations there. Your `.agents/plans` content is preserved; the installer
links `.cursor/plans` to it and leaves other Cursor content alone.

The installer also updates its rules in `.gitignore`, merges Agent Workflows
dependencies into `skills-lock.json`, restores the declared Skills, and
configures the project's providers.

## Provider prerequisites

During installation, select the project's item provider (ClickUp or Linear)
and version provider (GitHub or GitLab). An update preserves either supported
version provider and asks for one only when it is missing from the existing
configuration. Before running workflows, connect the selected integrations as
described in [Providers](/agent-workflows/providers/).
