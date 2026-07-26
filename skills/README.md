# Skills

This directory contains the project-level Skills used by AI agents.

A Skill is a reusable capability that can be installed into compatible agents to
give them procedural knowledge for a specific task.

Skills are not general documentation. They should describe repeatable
capabilities that an agent can invoke when needed.

---

## Purpose

Use this directory to:

* expose thin local bridges to repository workflows;
* document the external Skills used by the project;
---

## Organization

Each Skill lives in its own directory and belongs to one of two categories:

```text
./
├── README.md
├── <workflow>/             # Local workflow bridge, committed
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

## Local Workflow Bridges

The only Skills maintained and committed by this project are thin discovery
bridges. They delegate orchestration to the repository workflow that owns it
instead of duplicating workflow instructions.

Example:

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
ignore their installed directories, and restore them from the lock file:

```bash
npx skills experimental_install
```

No third-party Skill is adopted or committed by this project. Its reviewed
source, updates, and maintenance remain the responsibility of its upstream
owner.

Reference:

* [https://www.skills.sh/](https://www.skills.sh/)

The Skills directory describes Skills as reusable capabilities for AI agents and
shows installation with:

```bash
npx skills add <owner/repo>
```

Use managed external Skills when they provide a generic capability that should
remain owned and updated by their upstream project.

---

## Best Practices

* One Skill should cover one reusable capability.
* Keep `SKILL.md` short and action-oriented.
* Do not duplicate project knowledge inside Skills.
* Reference existing resources under `../rules/`, `../workflows/`, and
  `../templates/` when needed.
* Keep local bridges limited to discovery and workflow delegation.
* Manage external Skills as restored, ignored dependencies.
* Keep external Skill ownership and maintenance upstream.

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
