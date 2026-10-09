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

Run the bootstrap from the project root with no pending Git changes beyond
the files created by the command above, select your item and version providers,
then connect them as described in [Providers](/agent-workflows/providers/)
before running workflows.
