# Agent Workflows: Project Architecture

Agent Workflows gives coding agents a structured path from an initial request to a reviewed change, while keeping the decisions to save a ticket, approve a plan, and merge a request with a person. The repository also contains a local orchestration stack for running AI tasks through Kestra and recording their traces in Langfuse. These are two distinct parts of the current project: the agent workflows are defined as repository instructions, while Kestra runs flows that call a host-side AI bridge.

## Agent context and request routing

This repository is the source of an installable context bundle. Its `agents/`, `commands/`, `data/`, `goals/`, `providers/`, `rules/`, `skills/`, `templates/`, and `workflows/` directories become managed content under `.agents/` in a consuming project. The consuming project's root `AGENTS.md` points agents to global rules and to `workflows/play-book.md` at the start of a new task.

The playbook maps a request to one matching workflow. For example, writing one item routes to `/write`, selecting an item for delivery routes to `/pick`, and reviewing a request routes to `/inspect`. When no playbook route matches, `workflows/specialist.md` checks the activity against the themes in `data/agent-routing.md`. A matching theme activates a specialist profile from `agents/`; an unmatched activity proceeds without a specialist profile.

Profiles define a role and conditionally load the skills useful for that activity. A technical writer can load `technical-writing` for documentation, while an AI engineer has different skill triggers. The profile does not load every listed skill for every task. Native skills such as `/write`, `/pick`, and `/work` also provide direct entry points: each reads its corresponding workflow file. Thus a request can reach a workflow through the playbook or through an explicitly invoked skill.

Workflows keep the active context narrow. A top-level workflow selects a branch such as `write-create.md` or `write-update.md`, and only that branch's instructions are loaded. Similar splits handle item-backed versus standalone work and caller handoffs. A workflow then loads the rules, commands, templates, goals, provider operations, and specialist profile needed for its selected path.

## Delivery lifecycle

| Workflow | Responsibility and handoff |
| --- | --- |
| `/write` | Qualifies, drafts, and saves one provider-backed item after human confirmation. |
| `/pick` | Resolves an `agent-shaped` item, obtains an approved plan through `/plan`, then starts `/work`. If the item contains independent delivery units, it can offer `/refine` instead. |
| `/plan` | Creates one authoritative plan for a single delivery unit or returns a need for refinement. |
| `/refine` | Decomposes an oversized official item into confirmed child items without changing the parent. |
| `/work` | Executes plan todos, records their state in the plan, commits completed changes, and hands the result to `/ready`. |
| `/ready` | Rechecks the plan and delivery, sends gaps back to `/work`, then publishes the plan to the request and passes it to `/inspect`. |
| `/inspect` | Reviews a fixed request snapshot, publishes findings, sends blocking findings back to `/work`, or marks the item inspected. |
| `/done` | Handles a separate human-confirmed merge and completes the official item. |

The main autonomous loop is `/work` → `/ready` → `/inspect`, with correction paths back to `/work`. `/pick` supplies the official item and approved plan before that loop begins. `/done` is a later human decision, not part of the automatic inspection loop.

The supporting directories divide responsibilities. `goals/` defines completion contracts, `rules/` provides shared constraints, `commands/` defines reusable operations, `templates/` fixes handoff and output shapes, and `providers/` adapts operations to external systems. `plans/` holds the authoritative plan files used during delivery. This separation lets a workflow select a path and call a provider operation without embedding every integration detail in the workflow itself.

## Installation, skills, and providers

The `/agent-workflows` bootstrap skill installs or updates the bundle in a consuming Git project. It replaces the managed root `AGENTS.md` and managed `.agents/` sources, preserves project-owned `.agents/plans`, and creates `.cursor/plans` as a link to those plans. It merges the project's `skills-lock.json` with the bundle's dependencies and restores declared skills. The source repository tracks its native workflow skills; external skills used by profiles are declared in the lock file but their installed directories are ignored by Git. The same distinction is applied in consuming projects.

`agent-workflows.yaml` selects two provider roles. The **item provider** is Linear or ClickUp and owns ticket lookup, creation, labels, and status changes. The **version provider** is GitHub or GitLab and owns pull or merge requests and reviews. Commands resolve the configured provider and use its operations; they do not choose a fallback provider. Linear and ClickUp use MCP integrations, while GitHub and GitLab operations use the authenticated `gh` and `glab` CLIs. These workflow providers are separate from the AI provider used by the local orchestration bridge.

## Local orchestration architecture

Kestra and Langfuse run in Docker Compose. Kestra runs with its own PostgreSQL database and persistent storage. A flow can send an authenticated HTTP request to the bridge running on the host. The bridge remains outside Docker so a local Codex CLI process can use the host's files, configuration, authentication, and tools. It can instead call the OpenAI API when that AI provider is configured.

```text
Kestra (Docker) ──authenticated HTTP──> bridge (host) ──> Codex CLI or OpenAI API
                                              │
                                              └──> Langfuse traces (Docker)
```

The bridge exposes an authenticated task endpoint and a health endpoint. It selects the configured AI adapter and runs one inference at a time. Every accepted call starts a new inference, including calls with a repeated request ID. The request ID correlates responses and traces. A trace is sent once after inference; trace delivery failure does not change the inference result.

The Codex adapter starts a fresh, ephemeral CLI execution using local settings. The API adapter sends a request with its separately configured API credential. Both return a common task result for the bridge to return and trace. Langfuse receives the response, status, duration, and observed token usage through its tracing endpoint. Its web and worker services use PostgreSQL, ClickHouse, Redis, and MinIO for their supporting storage and processing.

The Kestra stack currently calls the bridge as a separate orchestration path. The repository does not connect Kestra directly to the playbook's `/write` through `/done` delivery chain. `README.md`, `ORCHESTRATION.md`, and `docs/` contain the user-facing setup and workflow guidance; this file describes how the pieces fit together.
