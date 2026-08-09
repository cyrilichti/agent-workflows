---
title: Installation
description: Add agent-workflows to a project.
---

From the project root, install the `agent-workflows` Skill:

```bash
npx skills add cyrilichti/agent-workflows --skill agent-workflows
```

Then invoke it explicitly from your agent:

```text
/agent-workflows
```

The same command installs a new project or updates an existing installation.

During installation, select the project's item provider (ClickUp or Linear)
and version provider (GitHub or GitLab). An update preserves either supported
version provider and asks for one only when it is missing from the existing
configuration.
