---
title: Installation
description: Add Agent Workflows to a project.
---

Node.js 24 or later must be available in the environment where your coding agent runs workflows.

From the project root, install the Agent Workflows bootstrap Skill:

```bash
npx skills add cyrilichti/agent-workflows --skill agent-workflows
```

Then invoke it explicitly from your agent:

```text
/agent-workflows
```

The same command installs a new project or updates an existing installation.

Run the bootstrap from the project root with no pending Git changes beyond
the files created by the command above, select your item and version providers,
then configure their access as described in [Providers](/agent-workflows/providers/)
before running workflows.
