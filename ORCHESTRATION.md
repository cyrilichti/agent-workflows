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

Install the host dependencies and create your configuration once:

```bash
npm ci
cp .env.example .env
cp agent-workflows.example.yaml agent-workflows.yaml
```

If either configuration file already exists, edit it directly. Select your item
and version providers in `agent-workflows.yaml`. Fill the secrets listed in
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

## Continuous work

`agent_workflows.work_loop` repeatedly runs the existing `agent_workflows.work`
flow. In Kestra, open **Flows**, select namespace `agent_workflows`, open
`work_loop`, and choose **Execute**. The controller starts one child execution
at a time and waits after it finishes, including success, failure, and no
eligible item. Only one controller execution can run at a time.

Configure the delay in the repository's `agent-workflows.yaml`:

```yaml
orchestration:
  workLoop:
    intervalSeconds: 300
```

The value must be an integer between 1 and 2147483647 seconds. Omitting the
setting uses 300 seconds (five minutes). The installer validates configuration
before importing flows. After editing it, redeploy the managed controller:

```bash
docker compose run --rm workflow-init
```

The installer updates `work_loop` from the repository and this configuration.
It preserves existing `work` and `demo` flows, including edits made in Kestra.
To apply a new delay to an active loop, kill its current execution and execute
`work_loop` again; running executions retain their original flow revision.

To stop the loop, open its running execution in Kestra and choose **Kill**.
Wait for the controller to reach `KILLED` before starting another execution.
Killing the controller prevents further cycles. An AI task already accepted
by the bridge may still finish and change files; inspect that child's result
before restarting.

Each cycle remains a separate `work` execution with its own final state, task
logs, responses, and trace information. The controller's `cycle-result` logs
record the child execution ID and state. When Kestra cannot collect a child's
outputs, `work-cycle` logs retain its execution link and collection error while
`cycle-result` reports `ERROR`. Open that child to inspect a failed
cycle and use its trace URLs to find the corresponding Langfuse requests.
Failed cycles remain failed even while the controller continues. Kestra and
Langfuse data persist in their Docker volumes; normal retention settings apply.

The controller retains iteration history while running. For long-running
installations, periodically kill and restart it to bound the active execution's
history. The standalone `work` flow remains available for a single cycle.

### Verify the loop against Kestra

The integration test deploys the bundled controller and `work` flow in a unique
test namespace, with a local fixture bridge. It makes no AI requests. It checks
success, failure, no-item results, sequential execution, delays, cancellation,
and redeployment, then removes its test flows while keeping execution history.
With Kestra running, export `KESTRA_ADMIN_EMAIL` and `KESTRA_ADMIN_PASSWORD`
from your local configuration, then run:

```bash
KESTRA_TEST_URL=http://localhost:3000 node --test test/orchestration/work-loop.integration.test.mjs
```

Kestra must reach the fixture server through `host.docker.internal`; override
`KESTRA_TEST_BRIDGE_HOST` when using another network layout. The test is skipped
in the regular unit suite unless `KESTRA_TEST_URL` is set.

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
resolution; an unresolved project leaves `projectDirectory` empty for a later
stage to handle conditionally.

Execution times out after 30 minutes by default (`REQUEST_TIMEOUT_MS`). A failed
or interrupted task may already have changed files: inspect its outcome before
submitting a new request. Kestra and Langfuse data persist in Docker volumes.

To stop, press `Ctrl+C` in the bridge terminal, then run `docker compose down`.
This keeps the saved data.
