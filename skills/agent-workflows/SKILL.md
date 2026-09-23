---
name: agent-workflows
description: >-
  Install or update agent-workflows in the current project. Use only when
  explicitly invoked with `/agent-workflows` or `$agent-workflows`.
disable-model-invocation: true
---

# Agent Workflows

Install or update agent-workflows in the current project.

## Rules

- Treat the root `AGENTS.md` and these `.agents/` directories as fully managed
  Agent Workflows sources:

  ```text
  agents
  commands
  data
  goals
  providers
  rules
  skills
  templates
  workflows
  ```

- Replace every fully managed source on installation and update. Do not merge
  local customizations into them.
- Treat `.agents/plans` as project-owned content. Never copy source-repository
  plans into a consuming project or remove consuming-project plans.
- Manage only `.cursor/plans` under `.cursor`. Preserve every other path.
- Do not create commits.

## Preflight

Before any mutation:

1. Work from the consuming project root.
2. Verify that Git, Node.js, and `npx` are available.
3. Require the project root to belong to a Git worktree.
4. Require the index and worktree to be clean, including untracked files.
   Allow only the bootstrap artifacts created by the documented
   `npx skills add ... --skill agent-workflows` command:
   - `.agents/skills/agent-workflows/**`;
   - the `agent-workflows` entry in `skills-lock.json`.

   Verify that no other path or lock entry changed before treating these as
   bootstrap artifacts. Stop and list every other dirty path.
5. Require `.agents`, when present, to be a real directory. Stop when it is a
   symlink, file, or Git submodule.
6. Require `.cursor`, when present, to be a real directory.
7. Resolve `.cursor/plans` without following it:
   - continue when it is absent;
   - continue when it is a symlink whose exact target is
     `../.agents/plans`;
   - otherwise stop and report the existing path and its type or target.
8. Create a temporary working directory outside `.agents`.

## Download

Clone the latest public repository into the temporary directory:

```text
https://github.com/cyrilichti/agent-workflows.git
```

Stop before deployment unless the downloaded repository contains:

- `AGENTS.md`;
- `agent-workflows.example.yaml`;
- `.gitignore`;
- `skills-lock.json`;
- every fully managed directory listed in Rules.

Read the downloaded and consuming `skills-lock.json` files and calculate the
merged lock before deployment. Require compatible lock-file versions.

Inspect ignored, untracked content inside every fully managed target
directory. Stop when it contains anything that is neither:

- a path present in the matching downloaded source directory; nor
- a Skill declared by the calculated merged lock under `.agents/skills`.

This check must include ignored files. Ordinary Git status is insufficient for
this guard.

## Deploy

Replace the consuming project's root `AGENTS.md` with the downloaded
`AGENTS.md`.

For every fully managed directory listed in Rules:

1. remove the matching directory under `.agents` completely;
2. recreate it from the matching downloaded source directory.

Create `.agents/plans` when absent. Otherwise preserve it and all of its
contents exactly. Do not copy the downloaded `plans` directory.

Do not copy the repository metadata, documentation site, build output,
dependencies, or unrelated root files.

## Integrate Cursor

Create `.cursor` when absent, then create `.cursor/plans` as a relative symlink
whose exact target is:

```text
../.agents/plans
```

The preflight owns every incompatible existing-path decision. Do not remove or
replace another `.cursor/plans` path during deployment, and do not modify any
other `.cursor` content.

## Compose Git Ignore Rules

Preserve the consuming project's root `.gitignore`, or create it when absent.
Derive the Agent Workflows ignore block from the downloaded `.gitignore` rules
for `plans/*`, `skills/*`, and every `!skills/<native-skill>/` exception. Prefix
each derived path with `.agents/`, producing the current equivalent of:

```gitignore
.agents/plans/*

.agents/skills/*
!.agents/skills/agent-workflows/
!.agents/skills/pick/
!.agents/skills/plan/
!.agents/skills/write/
!.agents/skills/refine/
!.agents/skills/work/
!.agents/skills/ready/
!.agents/skills/inspect/
!.agents/skills/done/
```

Treat only these consuming-project patterns as installer-owned:

```text
.agents/plans/*
.agents/skills/*
!.agents/skills/*/
```

Remove every existing exact line matching one of those patterns, including
exceptions for native Skills removed from the downloaded version. Append the
newly derived block once with one blank line around it. Preserve every other
line and its order. Do not duplicate rules on repeated execution.

Validate with `git check-ignore` that:

- a file below `.agents/plans` is ignored;
- a downloaded external Skill declared only in `skills-lock.json` is ignored;
- every downloaded native Skill is not ignored.

When existing broader rules prevent these outcomes, correct them only when the
required change is unambiguous. Otherwise stop and report the conflicting rule.

## Merge Skill Dependencies

- When the project lock file is absent, initialize it with the downloaded lock.
- Preserve project Skill entries not declared by agent-workflows.
- Add every downloaded Skill entry to the project lock.
- Replace a project entry when agent-workflows declares the same Skill name.
- Write the merged JSON atomically.

Then restore all declared dependencies:

```bash
npx skills experimental_install
```

Stop and report the command output when dependency installation fails.

## Configure Providers

GitHub uses its configured MCP integration. GitLab uses the official `glab`
CLI and requires the user to install it and authenticate it for the repository
host before running version workflows. Refer users to:

```text
https://docs.gitlab.com/cli/installation/
https://docs.gitlab.com/cli/authentication/
```

For a self-managed host, the authentication command is:

```bash
glab auth login --hostname gitlab.example.com
```

For GitLab.com, use `glab auth login`.

When `agent-workflows.yaml` already exists:

1. Preserve the configured item provider and every unrelated setting.
2. When `mcp.version.provider` is absent, ask which version provider the
   project uses with the selection below, then add the selected value.
3. When `mcp.version.provider` is `github` or `gitlab`, preserve it.
4. When `mcp.version.provider` has another value, stop and list the supported
   values. Do not overwrite the existing value.

When `agent-workflows.yaml` is absent:

1. Ask the user which item provider the project uses:

   ```text
   question: Which ticket provider does this project use?
   options:
   - label: ClickUp
     value: clickup
   - label: Linear
     value: linear
   ```

2. Ask which version provider the project uses:

   ```text
   question: Which version-control provider does this project use?
   options:
   - label: GitHub
     value: github
   - label: GitLab
     value: gitlab
   ```

3. Copy the downloaded `agent-workflows.example.yaml` to
   `agent-workflows.yaml`.
4. Set `mcp.item.provider` and `mcp.version.provider` to the selected values.

Use the same version-provider selection when an existing configuration is
missing `mcp.version.provider`.

## Validate

Before reporting success, verify:

- the root `AGENTS.md` equals the downloaded source;
- every fully managed directory equals its downloaded source and contains no
  obsolete path;
- `.agents/plans` still contains every pre-existing consuming-project plan;
- `.cursor/plans` is a symlink to `../.agents/plans` and no other `.cursor`
  content changed;
- the effective Git ignore behavior matches Compose Git Ignore Rules;
- the project lock contains every downloaded Skill entry;
- every declared Skill is installed;
- `agent-workflows.yaml` exists;
- `mcp.item.provider` is either `clickup` or `linear`.
- `mcp.version.provider` is either `github` or `gitlab`.
- a repeated deployment of the same downloaded version would produce no
  filesystem change.

Always remove the temporary download after success or failure.

Report whether agent-workflows was installed or updated, which managed sources
were replaced, that plans were preserved, the Cursor symlink result, the Git
ignore rules added, which lock entries were added or replaced, and the
configured item and version providers. When GitLab is configured, include the
`glab` installation and authentication prerequisite in the report.
