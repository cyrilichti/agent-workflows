# Skills

This directory contains the project-level Skills used by AI agents.

A Skill is a reusable capability that can be installed into compatible agents to
give them procedural knowledge for a specific task.

Skills are not general documentation. They should describe repeatable
capabilities that an agent can invoke when needed.

---

## Purpose

Use this directory to:

* store project-specific Skills;
* document which external Skills are recommended for this project;
* reference Skills installed from the public registry;
* keep project Skills close to the code when they depend on project conventions.

---

## Organization

Each local Skill lives in its own directory.

```text
./
├── README.md
├── write/                  # Local workflow bridge
│   └── SKILL.md
├── documentation-writer/    # Adopted and committed
│   └── SKILL.md
└── <managed-external>/     # Restored and ignored
    └── SKILL.md
```

`SKILL.md` is the Skill entrypoint.

Supporting folders are optional:

* `references/` contains supporting documentation loaded when needed;
* `scripts/` contains executable helpers;
* `assets/` contains templates or reusable files.

---

## Example

A local bridge keeps Skill discovery thin and delegates orchestration to the
workflow that owns it:

```markdown
---
name: write
description: >-
  Activate and execute the repository item authoring workflow. Use when
  the user wants to create or reformulate one item.
disable-model-invocation: true
---

# Write

Read `../../workflows/write.md` completely, then follow it exactly.
```

---

## External Skills

External Skills are dependencies by default. Record them in `skills-lock.json`,
ignore their installed directories, and restore them with the installation
workflow documented in the root `README.md`.

Reference:

* [https://www.skills.sh/](https://www.skills.sh/)

The Skills directory describes Skills as reusable capabilities for AI agents and
shows installation with:

```bash
npx skills add <owner/repo>
```

Use managed external Skills when they provide a generic capability that should
remain owned and updated by their upstream project.

### Adopted Skills

An external Skill may instead be adopted and committed here when consuming its
upstream dependency is disproportionate, unreliable, or incompatible with this
project's installation workflow.

Adopting a Skill means this project takes ownership of its reviewed source,
future maintenance, and any deliberate adaptations. Add each adopted Skill to
the explicit allowlist in `.gitignore`; do not add it to `skills-lock.json`.

`documentation-writer` is adopted because cloning its upstream repository to
install this single Skill is prohibitively expensive.

Use local Skills when the capability depends on this project, its domain, its
templates, or its internal workflows.

---

## Best Practices

* One Skill should cover one reusable capability.
* Keep `SKILL.md` short and action-oriented.
* Do not duplicate project knowledge inside Skills.
* Reference existing resources under `../rules/`, `../workflows/`, and
  `../templates/` when needed.
* Manage external Skills as ignored dependencies by default.
* Commit an external Skill only when the project explicitly adopts its
  maintenance.
* Prefer local Skills for project-specific behavior.
* Keep adopted Skills explicit in the `.gitignore` allowlist.

---

## References

* Skills Directory
  [https://www.skills.sh/](https://www.skills.sh/)

* Agent Skills Specification
  [https://agentskills.io/specification](https://agentskills.io/specification)

* AGENTS.md
  [https://agents.md/](https://agents.md/)

* .agents Protocol
  [dotagents-protocol]

[dotagents-protocol]:
  https://github.com/aj47/dotagentsprotocol-website
