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
└── ticket-writing/
    ├── SKILL.md
    ├── references/
    ├── scripts/
    └── assets/
```

`SKILL.md` is the Skill entrypoint.

Supporting folders are optional:

* `references/` contains supporting documentation loaded when needed;
* `scripts/` contains executable helpers;
* `assets/` contains templates or reusable files.

---

## Example

```markdown
---
name: ticket-writing
description: >-
  use this skill when creating or improving project tickets from meeting
  notes, user requests, bug reports, feature ideas, or implementation
  discussions. The skill produces clear, actionable tickets using the
  project's reusable templates.
---

# Ticket Writing

## Instructions

1. Identify the goal of the ticket.
2. Extract the business context.
3. Separate requirements from implementation suggestions.
4. Write acceptance criteria that can be verified.
5. Follow the output templates defined in `../../templates/`.

## References

- `../../templates/summary.md`
- `../../templates/checklist.md`
- `../../domain/`
- `../../rules/`
```

---

## External Skills

External Skills should be installed from the public Skill directory when
possible.

Reference:

* [https://www.skills.sh/](https://www.skills.sh/)

The Skills directory describes Skills as reusable capabilities for AI agents and
shows installation with:

```bash
npx skills add <owner/repo>
```

Use external Skills when they provide a generic capability that should not be
maintained inside this project.

Use local Skills when the capability depends on this project, its domain, its
templates, or its internal workflows.

---

## Best Practices

* One Skill should cover one reusable capability.
* Keep `SKILL.md` short and action-oriented.
* Do not duplicate project knowledge inside Skills.
* Reference `../domain/`, `../rules/`, `../workflows/` and `../templates/` when
  needed.
* Prefer external Skills for generic capabilities.
* Prefer local Skills for project-specific behavior.
* Package and install complete Skills rather than copying partial files between
  projects.

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
