# Agent orchestration

Kestra and Langfuse run in Docker. The bridge runs on the host under the same
user account as your local Codex CLI. It uses your host projects, tools, skills,
MCP integrations, configuration and authentication. It does not copy or mount
`~/.codex`, create Desktop chats, or provide Desktop-exclusive tools.

## Setup

Requires Docker Compose 2.24+, Node.js 24+, and a local Codex CLI supporting
`exec --ephemeral --json --cd --add-dir`. Run from the repository root:

```bash
npm run bridge:setup
# Fill the remaining secrets in .env and settings.
# Run codex login if your local CLI is not already authenticated.
docker compose up -d
npm run bridge
```

Setup creates `.env` from the example if missing, fills missing settings,
generates a bridge token when absent. It preserves existing values and credentials.
Set `INFERENCE_ENABLED=true` in `.env` when ready to execute tasks. Restart the
bridge after changing configuration. Clear `AI_MODEL` to inherit the CLI model;
an existing nonempty value remains an explicit override. `AI_PROVIDER=codex`
is the default; `openai-api` is still supported by the same host bridge and
requires an explicit `AI_MODEL` and funded `OPENAI_API_KEY`.

- Kestra: http://localhost:3000 — `KESTRA_ADMIN_EMAIL` / `KESTRA_ADMIN_PASSWORD`.
- Langfuse: http://localhost:3001 — `local@example.test` / `LANGFUSE_ADMIN_PASSWORD`.
- Bridge health: http://localhost:8787/health.

Keep the bridge process running, or manage `npm run bridge` with your OS service
manager using this repository as its working directory and the correct user.
The service manager must supply the same `HOME`, `PATH`, optional `CODEX_HOME`,
SSH agent and integration environment as your terminal. `CODEX_BIN` in `.env`
can specify the absolute path to Codex. The bridge's `.env` is not loaded into
the child CLI environment, so infrastructure credentials are not injected there.

## Local execution

The bridge starts Codex in its own working directory by default. Set
`CODEX_WORKING_DIRECTORY` to an absolute host path to choose another directory;
that path is passed as both the subprocess working directory and `--cd`.
No project registry, project discovery or project input is required. Resolving
a project and passing its directory from a future workflow is outside the
current scope; the CLI adapter already supports launching in a chosen directory.

Codex retains the user's configuration, tools, skills and MCP integrations.
Filesystem and network permissions are enforced by that configuration. No model,
reasoning level, sandbox or provider is forced on the CLI. Optional tools retain
their own installation, login and platform requirements. Tasks can change files
in their working environment according to the configured permissions.

Each call starts `codex exec --ephemeral`. No persistent CLI conversation is
created for Desktop to display; every call starts with a fresh prompt. Your
existing Desktop chat history is not sent. Only approval behavior is forced to
`never`: the HTTP bridge has no interactive approval UI, so operations needing
approval fail. Other settings and authentication are owned by the local CLI,
including keychain-backed login. `CODEX_WORKSPACE_ID` can optionally restrict the
ChatGPT workspace. When the model is inherited, traces use `configured-default`
rather than claiming a model name the CLI event stream did not report.

## Workflow and networking

The example `local.ai / local_agent` is installed automatically. Its inputs are
`requestId` and `prompt`. Results contain the response and trace URL.
Kestra uses `BRIDGE_URL` (default `http://host.docker.internal:8787`); Compose
adds the host-gateway alias for Linux. The bridge listens on `BRIDGE_HOST` and
`BRIDGE_PORT`. `.env.example` binds `0.0.0.0` for container access; restrict access
to trusted clients with the host firewall, or choose a reachable private bind
address. Use TLS or a secured tunnel if Kestra is on a different machine.

Every generation request requires a bearer token. `SECRET_BRIDGE_TOKEN` contains
the base64-encoded token so Kestra can read it through `secret('BRIDGE_TOKEN')`.
The bridge decodes the same value. The workflow passes it in the Authorization
header; it is not embedded in the workflow source. Health checks require no token.
The API accepts JSON `{ "requestId": "task-0001", "prompt": "..." }`
or text/plain with an `X-Request-Id` header.

## Results and failure handling

The bridge executes one task at a time. Results are stored in `.local/bridge`;
request identity includes prompt, provider and model override.
Reuse an identical request ID to retrieve the saved result. Use a new ID for a
new task, including after changing the working directory or inherited CLI configuration. A failed task
may already have modified files or external systems: inspect those changes
before submitting a new task. No automatic task retry or provider fallback runs.
Pending Langfuse traces are retried without rerunning Codex.

The execution deadline defaults to 30 minutes (`REQUEST_TIMEOUT_MS`, maximum
30 minutes), with a 35-minute Kestra HTTP timeout. The CLI JSON event stream is
limited to 32 MiB. Timeout cancels the subprocess group; the result remains
unknown because earlier tool side effects are not rolled back. Bridge shutdown
also cancels the active task. Back up `.local/bridge` and your project files;
Langfuse and Kestra state remains in Docker volumes.

## Migration from the container bridge

Stop old `bridge` / `bridge-api` containers before switching. The Compose file
no longer defines these services or the Codex image, auth/workspace volumes or
seccomp exception. Existing Docker volumes are not deleted or imported. The host
CLI uses its own existing login. Old request records remain in the old bridge
volume; the host result store starts separately.

The new workflow ID `local_agent` avoids overwriting edits to `local_ai`.
Switch to the new workflow; the old one still points to the removed container.
Initialization never overwrites an existing workflow, so later YAML updates must
be applied explicitly in Kestra. `COMPOSE_PROFILES` is no longer used to select
the AI provider; replace that setting with `AI_PROVIDER`.
