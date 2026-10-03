# Agent orchestration

Kestra runs workflows. A bridge running on your computer forwards their AI tasks
to your local Codex CLI or the OpenAI API. Langfuse records the responses and
observed token usage.

Kestra and Langfuse run in Docker; the bridge runs on the host so Codex can use
your local files, configuration, authentication, tools and integrations.

## Prerequisites

- Node.js 24+ and npm on the host.
- Docker with Docker Compose 2.24+.
- For the default Codex provider: Codex CLI installed and authenticated with
  `codex login`, with support for `codex exec --ephemeral --json`.

Run the commands below from the repository root.

## Configure

Create your configuration once:

```bash
cp .env.example .env
```

If `.env` already exists, edit it directly. Fill the secrets listed in
[.env.example](./.env.example). For each `*_PASSWORD`, `NEXTAUTH_SECRET`,
`LANGFUSE_SALT`, `LANGFUSE_ENCRYPTION_KEY`, `LANGFUSE_PUBLIC_KEY` and
`LANGFUSE_SECRET_KEY`, generate a separate value:

```bash
openssl rand -hex 32
```

For `SECRET_BRIDGE_TOKEN`, generate a base64-encoded value:

```bash
openssl rand -hex 32 | tr -d '\n' | openssl base64 -A
```

Paste this output directly into `.env`, without encoding it again. This token
allows Kestra to call the bridge. The Langfuse keys initialize your local
Langfuse project; neither replaces Codex login or an OpenAI API key.

Choose a provider and enable execution:

| Setting | Codex CLI (default) | OpenAI API |
| --- | --- | --- |
| `AI_PROVIDER` | `codex` | `openai-api` |
| `AI_MODEL` | Leave empty to use your CLI configuration | Required model identifier |
| `OPENAI_API_KEY` | Leave empty | API key issued by OpenAI |
| `INFERENCE_ENABLED` | `true` | `true` |

For Codex, optionally set `CODEX_WORKING_DIRECTORY` to an absolute project path.
Otherwise, tasks run in your home directory (`~`). `CODEX_BIN` can specify the
CLI executable path if it is not available on your `PATH`.

## Start

```bash
docker compose up -d --build
npm start
```

The Kestra image is built from [.docker/kestra/Dockerfile](./.docker/kestra/Dockerfile), which
prepares the storage directory for its user.

Keep `npm start` running in your terminal, under your usual Codex user account.
Restart it after changing `.env`.

| Service | Address | Credentials from `.env` |
| --- | --- | --- |
| Kestra | http://localhost:3000 | `KESTRA_ADMIN_EMAIL` / `KESTRA_ADMIN_PASSWORD` |
| Langfuse | http://localhost:3001 | `local@example.test` / `LANGFUSE_ADMIN_PASSWORD` |
| Bridge health | http://localhost:8787/health | None |

Kestra reaches the bridge through `BRIDGE_URL`, which defaults to
`http://host.docker.internal:8787`. The example configuration listens on
`0.0.0.0` so containers can connect; keep this port accessible only to trusted
clients. Task requests require the shared token.

## Run the demo

Docker Compose automatically imports [orchestration/demo.yaml](./orchestration/demo.yaml)
using [src/install.mjs](./src/install.mjs).

1. Open Kestra and select the `demo` workflow in the `demo` namespace.
2. Start an execution with `requestId: demo-0001` and a prompt such as
   `Explain the role of an orchestrator in two sentences.`
3. Read the `result` output and follow `traceUrl` to its Langfuse trace.

The installer preserves an existing workflow. If you edit the YAML later,
update the workflow in Kestra explicitly.

## Execution behavior

Each Codex task starts a fresh, ephemeral CLI session using your local settings.
It does not create a persistent conversation in Codex Desktop. Permissions come
from your CLI configuration; interactive approvals are disabled because the
bridge cannot answer them. Tasks can modify files when those permissions allow it.

The bridge runs one inference at a time. Each accepted request starts a new
inference, even when it reuses a request ID. The ID correlates the response with
its Langfuse trace. If an HTTP response is lost, sending the request again may
repeat the inference. Tasks and failed Langfuse deliveries are not retried
automatically.

Execution times out after 30 minutes by default (`REQUEST_TIMEOUT_MS`). A failed
or interrupted task may already have changed files: inspect its outcome before
submitting a new request. Kestra and Langfuse data persist in Docker volumes.

To stop, press `Ctrl+C` in the bridge terminal, then run `docker compose down`.
This keeps the saved data.
