---
name: project
description: >-
  Resolve a list value and item ID to one absolute local project
  directory. Use when explicitly invoked with /project or $project.
disable-model-invocation: true
---

# Project

Read these files together in one tool call, resolving their paths relative to
this Skill file without a separate working-directory lookup:

- `../../workflows/project.md`;
- `../../goals/project-complete.md`;
- `../../rules/user-facing-output.md`;
- `../../commands/resolve-local-project-directory.md`;
- `../../templates/project-path.md`.

Use the loaded files when the workflow references them; do not read them again.
Follow `../../workflows/project.md` exactly.
