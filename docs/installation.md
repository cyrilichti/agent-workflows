---
title: Installation
description: Add agent-workflows to a project.
---

From the project root, add `agent-workflows` as the `.agents` submodule:

```bash
git submodule add https://github.com/cyrilichti/agent-workflows.git .agents
```

Then run the skill from your agent:

```text
/agent-workflows
```

The skill automatically initializes a new installation or updates an existing
one.
