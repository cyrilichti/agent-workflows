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

## Provider prerequisites

Connect the MCP integrations required by the selected Linear, ClickUp, or
GitHub providers before running their workflows.

For GitLab, install the official [`glab` CLI](https://gitlab.com/gitlab-org/cli)
and authenticate it for the repository's GitLab host:

```bash
glab auth login --hostname gitlab.example.com
```

Use `glab auth login` without `--hostname` for GitLab.com. See GitLab's
[installation](https://docs.gitlab.com/cli/installation/) and
[authentication](https://docs.gitlab.com/cli/authentication/) guides for
platform-specific setup.

During installation, select the project's item provider (ClickUp or Linear)
and version provider (GitHub or GitLab). An update preserves either supported
version provider and asks for one only when it is missing from the existing
configuration.
