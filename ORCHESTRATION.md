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
[.env.example](./.env.example). For each `*_PASSWORD` except
`KESTRA_ADMIN_PASSWORD`, and for `NEXTAUTH_SECRET`, `LANGFUSE_SALT`,
`LANGFUSE_ENCRYPTION_KEY`, `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`,
generate a separate value:

```bash
openssl rand -hex 32
```

`KESTRA_ADMIN_PASSWORD` must contain at least eight characters, including one
uppercase letter, one lowercase letter and one digit. Generate a compatible
value separately:

```bash
printf 'Aa1-%s\n' "$(openssl rand -hex 30)"
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
| Langfuse | http://localhost:3001 | `LANGFUSE_ADMIN_EMAIL` / `LANGFUSE_ADMIN_PASSWORD` |
| Bridge health | http://localhost:8787/health | None |

Kestra reaches the bridge through `BRIDGE_URL`, which defaults to
`http://host.docker.internal:8787`. The example configuration listens on
`0.0.0.0` so containers can connect; keep this port accessible only to trusted
clients. Task requests require the shared token.

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

The bridge returns HTTP 200 for completed inference, 502 for a failed inference,
and 504 when the outcome is unknown. Error responses retain the trace URL in
their JSON body, so Kestra can fail the HTTP task without a separate status
check after each call. In `agent_workflows.work`, no eligible item skips project
resolution and execution; an unresolved project skips execution.

Execution times out after 30 minutes by default (`REQUEST_TIMEOUT_MS`, from 1
to 3600000 ms). A JSON request can override the deadline for its own call. At
expiration, the bridge kills the detached Codex process group, including its
tool subprocesses, and attempts trace delivery once with a 5-second limit.
A failed or interrupted task may already have changed files: inspect its
outcome before submitting a new request. Kestra and Langfuse data persist in
Docker volumes.

## Bridge request fields

Send `POST /generate` with `Content-Type: application/json` and the shared
bearer token:

```json
{
  "requestId": "execution-123-work",
  "prompt": "Execute /work for item ICY-94.",
  "directory": "/absolute/project/path",
  "timeoutMs": 3585000
}
```

`requestId` and `prompt` are required. `directory` and `timeoutMs` are optional:

- `directory` passes directly to Codex's `-C` argument and subprocess `cwd`.
  The bridge does not resolve or inspect the path again and does not change
  its own working directory. When omitted, Codex uses
  `CODEX_WORKING_DIRECTORY`, then the home directory.
- `timeoutMs` accepts an integer from 1 to 3600000 and overrides
  `REQUEST_TIMEOUT_MS` for that call only.

Overrides do not change subsequent calls. `directory` applies to the Codex CLI
provider; the OpenAI API provider has no local project execution. Existing
`text/plain` calls still send their request ID through `X-Request-Id` and use
the configured defaults. The response remains the existing JSON envelope,
with the agent's final response in `text`.

## Work flow

`agent_workflows.work` keeps three bridge operations: `next`, `project`, and
`work`. Its visible decisions skip `project` and `work` when no item is returned,
and skip `work` when project resolution returns no path. `work` receives the
exact selected item ID and the resolved path as `directory`.

The existing `/work` workflow retrieves the approved plan published on the
item and materializes it locally. One Codex session then executes
`/work → /ready → /inspect`, including correction loops. Kestra does not launch
separate sessions for those transitions. Merge through `/done` remains a
separate human-confirmed action.

| Operation | Bridge execution | HTTP idle wait | Kestra task ceiling |
| --- | --- | --- | --- |
| `next` | 285000 ms (4m45s) | 4m55s | 5m |
| `project` | 285000 ms (4m45s) | 4m55s | 5m |
| `work` | 3585000 ms (59m45s) | 59m55s | 1h |

Each operation has a 5-second connection timeout. The reserve inside each
ceiling leaves time for cancellation, trace delivery, and the HTTP response.
The `work` deadline covers its entire session and does not renew at workflow
transitions. Neither bridge calls nor failed operations are retried
automatically.

The final `/inspect` message follows `templates/inspect-result.md`. Success
reports `inspection published` for the request and `agent-inspected applied`
for the selected item, only after both operations are confirmed. Blocked or
partial results report observed outcomes and an exact remaining action when
known. The earlier analysis uses `templates/inspect-analysis.md`.

Kestra's `qualify-work` control task reads the final Markdown response and
fails the flow unless it matches that successful result for the selected item.
An HTTP 200 confirms inference completion; this final qualification confirms
the workflow's reported delivery outcome. The response and trace remain
available in the `work` task outputs, including when qualification fails.

Task descriptions start with `/next`, `/project`, and `/work`, followed by
their documentation introductions. Open a task's description in Kestra to
read it. `workResult` and `workTraceUrl` expose the work response and trace on
successful flows; skipped work returns an empty object and an empty URL.

The installer creates missing flows and retains existing ones. To update an
existing `agent_workflows.work`, explicitly import `orchestration/work.yaml`
through the Kestra flow editor, then save it. Restarting Compose alone does
not replace the stored definition.

To stop, press `Ctrl+C` in the bridge terminal, then run `docker compose down`.
This keeps the saved data.
