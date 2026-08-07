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

- Overwrite files when the downloaded repository contains the same relative
  path.
- Preserve additional files that do not collide.
- Do not create, modify, or remove `.cursor`.
- Do not create commits.

## Preflight

Before mutation:

1. Work from the consuming project root.
2. Verify that Git, Node.js, and `npx` are available.
3. Create `.agents` when absent. Otherwise use the existing path as-is,
   including when it is a directory, symlink, or Git submodule.
4. Create a temporary working directory outside `.agents`.

## Download

Clone the latest public repository into the temporary directory:

```text
https://github.com/cyrilichti/agent-workflows.git
```

Stop before deployment unless the downloaded repository contains:

- `AGENTS.md`;
- `agent-workflows.example.yaml`;
- `skills-lock.json`;
- every directory listed below.

## Deploy

Copy the contents of these downloaded directories into the matching directories
under `.agents`:

```text
agents
commands
data
goals
plans
providers
rules
skills
templates
workflows
```

For every directory:

- create the destination directory when absent;
- recursively copy its contents;
- overwrite files with the same relative path;
- preserve destination files that do not exist in the downloaded source.

Merge the downloaded `AGENTS.md` into the consuming project's root `AGENTS.md`:

- when the root file is absent, create it from the downloaded file;
- when the root file exists, preserve its content, remove the downloaded
  top-level `# AGENTS.md` heading, and append the remaining instructions;
- when the instructions are already present, do not append them again;
- never add ownership markers, HTML comments, metadata, or another generated
  heading.

Do not copy the repository metadata, documentation site, build output,
dependencies, or unrelated root files.

## Merge Skill Dependencies

Read the downloaded `skills-lock.json` and the consuming project's
`skills-lock.json`.

- When the project lock file is absent, initialize it with the downloaded lock.
- Require compatible lock-file versions.
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

- every file selected for deployment exists at the expected destination;
- the root `AGENTS.md` contains exactly one copy of the up-to-date
  agent-workflows instructions, without ownership comments or a duplicated
  `# AGENTS.md` heading;
- `.cursor` was not created or modified;
- the project lock contains every downloaded Skill entry;
- every declared Skill is installed;
- `agent-workflows.yaml` exists;
- `mcp.item.provider` is either `clickup` or `linear`.
- `mcp.version.provider` is either `github` or `gitlab`.

Always remove the temporary download after success or failure.

Report whether agent-workflows was installed or updated, which directories were
deployed, which lock entries were added or replaced, and the configured item
and version providers.
