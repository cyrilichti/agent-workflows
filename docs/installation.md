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

Run the bootstrap from a Git worktree without pending changes. The bootstrap
artifacts created by `npx skills add` are the only accepted exception before
deployment; any other dirty or unrecoverable local content stops the operation.

Agent Workflows completely replaces the root `AGENTS.md` and its managed
`.agents/` sources on every installation or update. Review the resulting Git
diff and restore any project-specific customizations that should remain.
Removed upstream files are removed from the consuming project as well.

Project plans are different: `.agents/plans` is created when absent and always
preserved on update. The installer creates `.cursor/plans` as a relative
symlink to `../.agents/plans` without changing any other Cursor content. An
existing incompatible path stops the installation instead of being replaced.

The root `.gitignore` is preserved and completed idempotently so project plans
and restored external Skills stay ignored while native Agent Workflows Skills
remain trackable. Skill lock entries owned by the consuming project are merged
with Agent Workflows dependencies before `npx skills experimental_install`
restores them.

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
