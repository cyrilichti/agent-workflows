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
`/generate`. JSON requests carry `requestId`, `prompt`, and optional
`directory` and `timeoutMs` fields with the shared bearer token. Existing text
requests carry their ID in `X-Request-Id`. The bridge starts a fresh Codex CLI
execution on the host or sends the task to the OpenAI API, returns a JSON result to Kestra,
and sends a trace to Langfuse. The bridge must be running for Kestra to
reach either provider.

## Execute an approved plan

The `agent_workflows.work` flow calls `/next`, then `/project` for the returned
item, then `/work` in its resolved directory. No eligible item or no resolved
path skips execution. The three HTTP operations have maximum task durations
of 5 minutes, 5 minutes, and 1 hour, with shorter bridge deadlines to leave room
for cancellation, tracing, and the response. See the
[operation budgets](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#work-flow)
for the exact values.

`directory` applies only to the current Codex call; an omitted directory uses
`CODEX_WORKING_DIRECTORY`, then the home directory. `timeoutMs` overrides
`REQUEST_TIMEOUT_MS` for the current call and supports up to one hour. Expiration
stops Codex and its tool subprocesses. Inspect any existing effects before
submitting another request.

The `work` call keeps `/work → /ready → /inspect` and correction loops in one
Codex session. Its final human-readable inspection result confirms publication
and application of `agent-inspected`; Kestra fails the flow if that successful
result is missing. `/done` remains a separate human-confirmed action.

The installer retains existing flows. Import the revised
`orchestration/work.yaml` into the Kestra editor and save it to update a stored
flow.

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

Keep this process running. Kestra reaches the host bridge through
`BRIDGE_URL`, which defaults to
`http://host.docker.internal:8787`; the bridge health endpoint is
`http://localhost:8787/health`. Kestra is at `http://localhost:3000` and
Langfuse at `http://localhost:3001`.
