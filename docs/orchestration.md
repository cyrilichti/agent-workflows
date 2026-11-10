---
title: Orchestration
description: Run ready, planned tickets through delivery without writing prompts.
---

Orchestration executes ready tickets with approved plans without asking you to
write a prompt for each one. It selects the next eligible ticket, runs the
delivery workflow through implementation and review, and leaves the final
merge decision to you.

## How the pieces connect

<div class="orchestration-map" role="group" aria-label="Kestra sends an HTTP request to the host bridge. The bridge calls Codex CLI and sends tracing data to Langfuse.">
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
        <strong>Codex CLI</strong>
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

## Start the architecture locally

Prerequisites:

- [Node.js 24+](https://nodejs.org/en/download) and npm
- [Docker with Compose 2.24+](https://docs.docker.com/compose/install/)
- [Codex CLI](https://github.com/openai/codex), authenticated with `codex login`

From the repository root, create `.env` from `.env.example` if needed. Follow
the [configuration guide](https://github.com/cyrilichti/agent-workflows/blob/main/ORCHESTRATION.md#configure)
to add the required secrets and enable Codex before starting the services.

```bash
docker compose up -d --build
```

Then start the bridge **on the host machine**, under your usual user account
(the one authenticated with Codex CLI):

```bash
npm start
```

Keep this process running. Kestra reaches the host bridge through
`BRIDGE_URL`. The local service addresses are:

- Kestra: [http://localhost:3000](http://localhost:3000)
- Langfuse: [http://localhost:3001](http://localhost:3001)
- Bridge health: [http://localhost:8787/health](http://localhost:8787/health)
