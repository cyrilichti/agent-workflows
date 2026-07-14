# Agentic Engineering

Shared agentic engineering frame for AI-assisted software work.

This repository is designed to be installed in projects as their `.agents/`
directory. It provides a reusable operating model for AI agents: workflows,
sub-agents, rules, skills, templates, hooks, and tool configuration.

## Purpose

The goal is to make AI usage more predictable across projects and teams.

Instead of letting each assistant answer as a generic chat bot, this frame
pushes agents to:

- route the work before acting;
- follow an explicit workflow;
- activate a specialized technical posture;
- load only the context required for the current task;
- produce focused outputs aligned with the selected workflow.

It is a coordination layer for agentic work, not a knowledge dump.

## Installation

There are two supported ways to adopt this frame in a project.

### Owned Copy

Clone or copy the repository into a project, then adapt it freely.

Use this model when the project wants to own and evolve its agentic frame
independently.

### Synced Submodule

Keep this repository synchronized as the project's `.agents/` directory:

```bash
git submodule add https://github.com/seeren/agentic-engineering.git .agents
```

Then expose thin tool adapters at the project root:

```bash
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/CLAUDE.md CLAUDE.md
ln -s .agents/.cursor .cursor
```

This creates:

```text
.agents/                  # synced submodule
AGENTS.md                 # symlink to .agents/AGENTS.md
CLAUDE.md                 # symlink to .agents/CLAUDE.md
.cursor/                  # symlink to .agents/.cursor
```

This keeps the shared agentic frame updatable while preserving a small local
surface for each AI tool.

## Project Knowledge

Business, product, architecture, and operational knowledge should usually stay
inside the consuming project, for example:

```text
docs/
```

Sub-agents can inspect those docs when the task requires domain context. The
shared `.agents/` frame should remain mostly technical, reusable, and
cross-project.

This separation keeps the agentic workflow portable while allowing each project
to carry its own domain language, constraints, runbooks, and decisions.

## Design Principle

Load less, but load better.

Rules, skills, and workflows should be selected for the current task. They
should not become broad background text that weakens more specific instructions.

The system favors small routed context over large global prompts.

## Non-Goals

This repository is not:

- a replacement for project documentation;
- a business knowledge base;
- a universal prompt loaded in every conversation;
- a place for project-specific domain rules unless they are intentionally shared
  across projects.
