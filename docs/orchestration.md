---
title: Orchestration
description: Run Kestra and Langfuse locally, connect the bridge, and build from the bundled workflows.
---

Use the local orchestration stack to run AI tasks from Kestra and inspect their
results in Langfuse. The stack is separate from the interactive `/write` to
`/done` delivery chain described under [Workflows](/agent-workflows/workflows/).

## How the pieces connect

```text
Kestra (Docker) ──authenticated HTTP──> Bridge (host) ──> Codex CLI or OpenAI API
                                            │
                                            └────────────> Langfuse (Docker)
```

Kestra schedules and runs workflows. The bridge receives their AI requests and
uses either an ephemeral local Codex CLI session or the configured OpenAI API
model. It sends the response and observed usage to Langfuse. The bridge runs on
the host so Codex can access your local project, configuration, and tools.

## Start the local stack

You need Node.js 24+, npm, and Docker with Compose 2.24+. For the default
`codex` provider, install and authenticate Codex CLI with `codex login`.

From the repository root, create `.env` from the example and fill in its
required secrets. Choose `AI_PROVIDER=codex` or `AI_PROVIDER=openai-api`, then
set `INFERENCE_ENABLED=true`. The API option also needs `AI_MODEL` and
`OPENAI_API_KEY`. Follow the [configuration guide](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#configure) for the exact secret-generation commands and optional Codex working directory.

```bash
cp .env.example .env
docker compose up -d --build
npm start
```

Keep `npm start` running in its own terminal. Kestra is at
`http://localhost:3000`, Langfuse at `http://localhost:3001`, and bridge health
at `http://localhost:8787/health`. Kestra reaches the bridge through
`BRIDGE_URL` (by default, `http://host.docker.internal:8787`); task calls use
`SECRET_BRIDGE_TOKEN` from `.env`.

## Run an example, then extend it

Docker Compose imports two YAML workflows when they do not already exist in
Kestra:

| Example | What it provides | Try it |
| --- | --- | --- |
| [`demo/demo`](https://github.com/cyrilichti/agent-workflows/blob/main/orchestration/demo.yaml) | Sends a prompt through the bridge and returns the result and Langfuse trace URL. | In Kestra, start `demo` in the `demo` namespace with a `requestId` and a `prompt`. |
| [`agent_workflows/work`](https://github.com/cyrilichti/agent-workflows/blob/main/orchestration/work.yaml) | Calls `/next` through the bridge and returns the selected item and trace URL. | Install Agent Workflows in the Codex project, connect its item provider, then start `work` in the `agent_workflows` namespace. |

Start with `demo` to check the bridge and tracing path. To build an automated
delivery flow, copy or edit `work.yaml` and add the stages you need after item
selection. The bundled `work` example stops after `/next`; planning,
implementation, review, and scheduling are workflows to build. If you change
an imported YAML file, update its workflow in Kestra explicitly: the importer
preserves an existing workflow.

For `work`, set `CODEX_WORKING_DIRECTORY` to the project where you completed
[Agent Workflows installation](/agent-workflows/installation/). The selected
item provider must be accessible to the Codex CLI running on the host.

See the [full orchestration guide](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md) for execution behavior, timeouts, and shutdown.
