---
title: Orchestration
description: How Kestra, the host bridge, an AI provider, and Langfuse connect.
---

The local stack contains **Kestra** to run workflows, **Langfuse** to record
traces, and a **bridge** supplied by this repository to connect Kestra to an
AI provider. Docker Compose runs Kestra and Langfuse with their supporting
PostgreSQL, ClickHouse, Redis, and MinIO services. The bridge runs separately
on your machine, where it can use your local Codex CLI, project files, and
authentication. It can also call the OpenAI API when configured to do so.

## How the pieces connect

<div class="orchestration-map" role="group" aria-label="Kestra sends an HTTP request to the host bridge. The bridge calls Codex CLI or the OpenAI API and sends tracing data to Langfuse.">
  <div class="orchestration-map__node orchestration-map__node--kestra">
    <small>Orchestration</small>
    <strong>Kestra</strong>
    <span>Runs workflows and sends AI tasks.</span>
  </div>

  <div class="orchestration-map__connector" aria-hidden="true"><span>Ask</span><b>↓</b></div>

  <div class="orchestration-map__node orchestration-map__node--bridge">
    <small>Connection</small>
    <strong>Bridge</strong>
    <span>Accepts the request and calls the configured AI provider.</span>
  </div>

  <div class="orchestration-map__branches">
    <div class="orchestration-map__branch">
      <div class="orchestration-map__connector" aria-hidden="true"><span>Task</span><b>↓</b></div>
      <div class="orchestration-map__node orchestration-map__node--provider">
        <small>Inference</small>
        <strong>Codex CLI / OpenAI API</strong>
        <span>Executes the AI task and returns its response.</span>
      </div>
    </div>
    <div class="orchestration-map__branch">
      <div class="orchestration-map__connector" aria-hidden="true"><span>Trace</span><b>↓</b></div>
      <div class="orchestration-map__node orchestration-map__node--langfuse">
        <small>Tracing</small>
        <strong>Langfuse</strong>
        <span>Records the response and observed token usage.</span>
      </div>
    </div>
  </div>
</div>

Kestra makes an authenticated HTTP `POST` to the host bridge at
`/`. The request carries a text task, an `X-Request-Id`, and the
shared bearer token. The bridge starts a fresh Codex CLI execution on the
host or sends the task to the OpenAI API, returns a JSON result to Kestra,
and sends a trace to Langfuse. The bridge must be running for Kestra to
reach either provider.

The `work` flow uses authenticated `POST /scripts` to run the selector and
project resolver on the host. Kestra parses their `stdout` and proceeds to
`/work` only with a resolved repository path. Scripts retain the permissions
of the bridge process; path checks restrict their entrypoint to the configured
project. See the [script contract](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#project-script-execution)
for request, output, and execution limits.

## Start the architecture locally

You need Node.js 24+, npm, and Docker with Compose 2.24+. To use the local
Codex CLI, install it and authenticate with `codex login`. From the repository
root, create `.env` and fill its required secrets. Set `INFERENCE_ENABLED=true`
and choose `AI_PROVIDER=codex` or `AI_PROVIDER=openai-api`; the API option also
requires `AI_MODEL` and `OPENAI_API_KEY`. See the
[configuration guide](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#configure)
for the secret-generation commands and other settings. If `.env` already
exists, edit it instead of copying the example over it.

```bash
cp .env.example .env
docker compose up -d --build
```

Then start the bridge **on the host machine**, under your usual user account
(the one authenticated with Codex CLI when using that provider):

```bash
npm start
```

The work flow selects items through authenticated `POST /scripts`, which runs the
TypeScript selector on the host without an AI call. Configure the selector's
project, provider CLI, and credentials using
[Item selection and project resolution](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#item-selection-and-project-resolution).
Use flow input `commandsDirectory=commands` for a source checkout or
`.agents/commands` for an installed project. Existing Kestra flows are retained at startup; follow that guide's upgrade
procedure to install the changed flow.

Keep this process running. Kestra reaches the host bridge through
`BRIDGE_URL`. The local service addresses are:

- Kestra: [http://localhost:3000](http://localhost:3000)
- Langfuse: [http://localhost:3001](http://localhost:3001)
- Bridge health: [http://localhost:8787/health](http://localhost:8787/health)
