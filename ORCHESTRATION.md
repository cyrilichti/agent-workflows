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

## Kestra instance identity

The `kestra.environment` settings in [compose.yaml](./compose.yaml) display
**Agent Workflows** with `#4D7FF0`, the blue at the end of the repository's
light logo gradient. These are instance defaults; Kestra's UI lets a browser
override the environment name or color locally. No personal UI setting is
changed by this configuration. After rebuilding Kestra, inspect the values
returned to the UI with:

```bash
docker compose exec -T kestra sh -c 'curl --fail --silent --user "$KESTRA_ADMIN_EMAIL:$KESTRA_ADMIN_PASSWORD" http://localhost:8080/api/v1/configs' | jq '.environment'
```

The Agent Workflows logo appears on the sign-in page and in the main sidebar,
and `kestra.webserver.html-title` brands the browser tab. Kestra 2.0.4 accepts
`kestra.webserver.html-head` as an HTML string, so
[compose.yaml](./compose.yaml) injects CSS with the two repository SVGs encoded
as data URIs. The light asset is the default; `html.dark` selects the dark
asset. The icons are decorative: the environment badge names the instance in
the application, and the sign-in page retains Kestra's heading. The original
sign-in image is hidden so its "Kestra" alternative text does not describe the
replacement mark.

This customization depends on Kestra 2.0.4's internal `.oss-login` and
`#side-menu .ks-sidebar__header` markup. The sidebar has no supported branding
slot. A version upgrade can break these selectors, so check both themes and
the narrow sidebar after an upgrade. The SVG bytes are duplicated in Compose;
if either source asset changes, regenerate its base64 data URI in `html-head`.
Kestra does not serve these repository files directly: a request for
`/ui/agent-workflows-logo.svg` returns the UI's `text/html` fallback.

This decision is based on the pinned [webserver configuration](https://github.com/kestra-io/kestra/blob/v2.0.4/webserver/src/main/java/io/kestra/webserver/configuration/WebserverConfiguration.java),
[sidebar component](https://github.com/kestra-io/kestra/blob/v2.0.4/ui/src/components/layout/SideBar.vue),
[sign-in component](https://github.com/kestra-io/kestra/blob/v2.0.4/ui/src/components/basicauth/BasicAuthLogin.vue),
and [environment badge](https://github.com/kestra-io/kestra/blob/v2.0.4/ui/src/components/layout/Environment.vue).

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
check after each call. In `agent-workflows.work`, no eligible item skips project
resolution; an unresolved project leaves `projectDirectory` empty for a later
stage to handle conditionally.

Execution times out after 30 minutes by default (`REQUEST_TIMEOUT_MS`). A failed
or interrupted task may already have changed files: inspect its outcome before
submitting a new request. Kestra and Langfuse data persist in Docker volumes.

To stop, press `Ctrl+C` in the bridge terminal, then run `docker compose down`.
This keeps the saved data.
