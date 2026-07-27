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

## Configure Item Provider

When `agent-workflows.yaml` already exists, preserve it unchanged.

When it is absent:

1. Ask the user which item provider the project uses:

   ```text
   question: Which ticket provider does this project use?
   options:
   - label: ClickUp
     value: clickup
   - label: Linear
     value: linear
   ```

2. Copy the downloaded `agent-workflows.example.yaml` to
   `agent-workflows.yaml`.
3. Set only `mcp.item.provider` to the selected value.

## Validate

Before reporting success, verify:

- every downloaded file exists at the expected destination;
- the root `AGENTS.md` contains exactly one copy of the up-to-date
  agent-workflows instructions, without ownership comments or a duplicated
  `# AGENTS.md` heading;
- `.cursor` was not created or modified;
- the project lock contains every downloaded Skill entry;
- every declared Skill is installed;
- `agent-workflows.yaml` exists;
- `mcp.item.provider` is either `clickup` or `linear`.

Always remove the temporary download after success or failure.

Report whether agent-workflows was installed or updated, which directories were
deployed, which lock entries were added or replaced, and the configured item
provider.
