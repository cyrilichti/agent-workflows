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

## Configure the local stack

You need the following tools on the host.

- [Node.js 24+](https://nodejs.org/en/download) and npm
- [Docker with Compose 2.24+](https://docs.docker.com/compose/install/)
- [Codex CLI](https://github.com/openai/codex), authenticated with `codex login`
- OpenSSL for generating secrets

From the repository root, copy the example if you do not already have a
`.env` file. Edit your existing `.env` directly if you have one.

```bash
cp .env.example .env
```

Generate a fresh value for each `*_PASSWORD` except `KESTRA_ADMIN_PASSWORD` and
for each of `NEXTAUTH_SECRET`, `LANGFUSE_SALT`, `LANGFUSE_ENCRYPTION_KEY`,
`LANGFUSE_PUBLIC_KEY`, and `LANGFUSE_SECRET_KEY`.

```bash
openssl rand -hex 32
```

`KESTRA_ADMIN_PASSWORD` requires at least eight characters, including an
uppercase letter, a lowercase letter, and a digit. Generate it separately.

```bash
printf 'Aa1-%s\n' "$(openssl rand -hex 30)"
```

Generate `SECRET_BRIDGE_TOKEN` as a base64-encoded value and paste the output
directly into `.env`.

```bash
openssl rand -hex 32 | tr -d '\n' | openssl base64 -A
```

Set `AI_PROVIDER=codex` and `INFERENCE_ENABLED=true`. Leave `AI_MODEL` empty
to use the model configured in your Codex CLI.

## Start the services

```bash
docker compose up -d
```

Then start the bridge **on the host machine**, under your usual user account
(the one authenticated with Codex CLI):

```bash
npm start
```

Keep the bridge running and restart it after editing `.env`. Kestra reaches
the host bridge through `BRIDGE_URL`, which defaults to
`http://host.docker.internal:8787`.

| Service | Local address | Sign-in variables |
| --- | --- | --- |
| Kestra | [http://localhost:3000](http://localhost:3000) | `KESTRA_ADMIN_EMAIL`, `KESTRA_ADMIN_PASSWORD` |
| Langfuse | [http://localhost:3001](http://localhost:3001) | `LANGFUSE_ADMIN_EMAIL`, `LANGFUSE_ADMIN_PASSWORD` |
| Bridge health | [http://localhost:8787/health](http://localhost:8787/health) | Public endpoint |
