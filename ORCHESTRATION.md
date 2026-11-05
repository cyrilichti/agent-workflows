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
An explicit value takes priority; otherwise, tasks run from the
`agent-workflows` repository root. `CODEX_BIN` can specify the CLI executable
path if it is not available on your `PATH`.

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

## Project script execution

Authenticated `POST /scripts` runs any project-relative TypeScript file with
Node.js 24+, independently of `INFERENCE_ENABLED`. The bridge's route table is
`GET /health` (public), `POST /` (AI tasks), and `POST /scripts` (scripts).
Use the same bearer token for both POST routes.

```http
POST /scripts
Authorization: Bearer <decoded SECRET_BRIDGE_TOKEN>
Content-Type: application/json

{"path":"commands/resolve-local-project-directory.ts","args":["Project name","item-id"]}
```

`path` is a nonblank relative `.ts` path; `args` is an optional array of strings
(default `[]`). The bridge canonicalizes the configured project and entrypoint,
requires a regular `.ts` file inside that project, and rejects traversal and
symlinks leading outside it. It runs Node with the canonical file and separate
arguments, without shell interpolation, from the canonical project directory.
The path check limits the chosen entrypoint; the executed script retains the
bridge process's permissions, environment, and access to files and programs.

Successful execution returns HTTP 200 with `{"stdout":"…","stderr":"…"}`.
The bridge does not parse or validate script output. Execution is limited to
285 seconds and 1 MiB of combined stdout/stderr; exceeding either limit kills
the process group. Errors use `{"error":"<code>"}`:

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `invalid_json` | Malformed request JSON. |
| 400 | `invalid_script_input` | Invalid path or arguments. |
| 400 | `invalid_script_path` | Missing, outside-project, or ineligible target. |
| 413 | `body_too_large` | Request body exceeds the bridge limit. |
| 500 | `script_project_unavailable` | Configured project cannot be resolved. |
| 502 | `script_failed` | Script failed to start or exited unsuccessfully. |
| 502 | `script_output_too_large` | Combined output limit exceeded. |
| 504 | `script_timeout` | Execution deadline exceeded. |

### Item selection and project resolution

The `work` flow calls `/scripts` for `select-next-item.ts` and, for a selected
item, `resolve-local-project-directory.ts` with the item's `list` and `id` as
arguments. Kestra parses `stdout` as JSON before applying the item and project
switches. A resolved path starts `/work`; `not found` or `search incomplete`
records a failed attempt. Empty selection ends the attempt normally. Malformed
output or HTTP failure fails the attempt. Every attempt waits before retrying.

Set `CODEX_WORKING_DIRECTORY` to the absolute project directory containing
`agent-workflows.yaml`. Set the flow input `commandsDirectory` to `commands`
(the default) for this source checkout, or `.agents/commands` for an installed
project with `.agents/commands` and `.agents/providers` files.
The provider configured under `item.provider` must have its CLI (`linear` or
`clickup-cli`) on the bridge process's `PATH`, authenticated under the host user
running the bridge. CLI credentials and environment variables must be available
to that process; values parsed from `.env` are not exported to script children.
See [Providers](./docs/providers.mdx) for provider setup. Restart the bridge after
changing its configuration.

### Work outcome reporting

After `/work`, each `is-success` branch calls `publish-work-result.ts` through
`POST /scripts` with the exact selected item ID, `success`, `partial`, or `error`,
the useful response output, and the Kestra execution ID. HTTP error responses
are classified as `error`; request failures and timeouts have a separate error
handler that reports the missing response and points to the failing task logs.
They may already have changed files, so check the execution before retrying.

The command uses `item.provider` from the bridge's configured project and the
same authenticated provider CLI as selection. It confirms the new comment from
the provider response; Kestra also verifies the command's JSON acknowledgement.
Output is bounded before script transport and comments are limited to 8,000
Unicode characters, with an explicit truncation notice retaining the beginning
and final diagnostic output. The complete bridge response remains in Kestra.

Publication is attempted before `partial` or `error` ends the attempt. A failed
publication or missing acknowledgement leaves a failed task and an explicit
ERROR log in Kestra. Each report is inside `AllowFailure`, so it preserves the
original work outcome and reaches the existing cycle delay. Publication is not
retried automatically; consult task logs if the provider accepted a comment but
its response was lost.

### Upgrade an existing Kestra flow

The Compose installer retains existing flows, including local edits. Stop the
running `agent-workflows/work` execution in Kestra and back up its flow YAML.
Update this repository, restart the bridge, and replace the flow's source in
the Kestra editor with [orchestration/work.yaml](./orchestration/work.yaml).
Save it, reapply needed local customizations, and start a new execution with
`commandsDirectory` set for your installation. Confirm that `next` and `project`
both call `/scripts` and that their switches parse the response's `stdout`.
New installations import this flow automatically.

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
check after each call. In `agent-workflows.work`, no eligible item skips project
resolution; an unresolved project records a failed attempt and skips `/work`.

Execution times out after 30 minutes by default (`REQUEST_TIMEOUT_MS`). A failed
or interrupted task may already have changed files: inspect its outcome before
submitting a new request. Kestra and Langfuse data persist in Docker volumes.

To stop, press `Ctrl+C` in the bridge terminal, then run `docker compose down`.
This keeps the saved data.
