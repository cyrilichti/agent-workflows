# Agent Workflows

**Automate the delivery loop. Keep the final say.**

[Install Agent Workflows](#quick-start) · [Explore the documentation](https://cyrilichti.github.io/agent-workflows/) · [See every workflow](https://cyrilichti.github.io/agent-workflows/workflows/)

![Agent Workflows delivery lifecycle: shape and plan work with assistance, start autonomous delivery as a human, loop between delivery and review until no blocking findings remain, then make a human merge decision.](./public/readme-lifecycle.svg)

## Quick start

```bash
npx skills add cyrilichti/agent-workflows --skill agent-workflows
```

Then run `/agent-workflows` once to install or update the system in your project.

## What it feels like

[![Animated preview of Agent Workflows: shape an AI search ticket, approve the plan, build and review the change, then merge and complete the Linear ticket.](./public/readme-workflow-demo.gif)](https://cyrilichti.github.io/agent-workflows/)

[Open the full demo](https://cyrilichti.github.io/agent-workflows/) to explore each step and its behind-the-scenes details.

Agent Workflows installs into your project's `.agents/` context. See the
[installation guide](https://cyrilichti.github.io/agent-workflows/installation/)
for provider setup and update behaviour.

## Work with your existing tools

| Work items | Version control |
| --- | --- |
| Linear · ClickUp | GitHub · GitLab |

See [provider setup](https://cyrilichti.github.io/agent-workflows/providers/) for the required integrations.

## Documentation

Start with the [installation guide](https://cyrilichti.github.io/agent-workflows/installation/), then explore [provider setup](https://cyrilichti.github.io/agent-workflows/providers/) and the [workflow reference](https://cyrilichti.github.io/agent-workflows/workflows/).

## Community

New workflows and skill integrations are welcome. Read [Contributing](./CONTRIBUTING.md), [Support](./SUPPORT.md), [Security](./SECURITY.md), and the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE)

## Local AI workflow (Docker)

Run a first Flowise workflow and inspect its persisted Langfuse trace. Select
**Codex with a ChatGPT login** for a subscription-backed local trial, or
**OpenAI Responses API with a project token** for API deployment preparation.
Both adapters implement the same contract; changing providers requires no
Flowise or tracing changes. This is a trusted, single-user local setup.
Orchestration and storage run locally; inference sends the prompt to OpenAI.

### Prerequisites and startup

Use Docker Engine/Desktop with Compose **2.24.4 or newer**, Python 3, internet
access and free ports 3000/3001. The stack was exercised on Apple Silicon with
Docker 28.3, Compose 2.38.1 and approximately 10 GB of Docker VM memory. Reserve
several GB of disk space for images and growing traces. Other architectures
have not been exercised here.

From the repository root:

```bash
python3 local-ai/setup.py
./local-ai/compose up -d --build
./local-ai/compose ps
python3 local-ai/flowise.py install
```

Wait for Flowise and Langfuse health checks before importing. Setup generates
private `local-ai/.env` secrets once and leaves `INFERENCE_ENABLED=false`.
An existing `.env` is retained. Do not commit, paste into tickets or regenerate
these secrets for an existing installation: they protect persistent data.

The pinned images are Flowise 3.1.4, Langfuse web/worker 4.48.0, PostgreSQL 17.6,
ClickHouse 25.12, Redis 7.2.6, and a digest-pinned Chainguard MinIO image. The
bridge uses Node 24 and, only in Codex mode, Codex CLI 0.159.2. Image digests are
in `local-ai/compose.yaml` and `local-ai/bridge/Dockerfile`. Flowise uses its own
PostgreSQL database because its pinned SQLite session integration failed at
runtime. Its encryption material and blob storage remain in a separate volume.

### Choose authentication and enable inference

| Mode | Configuration in `local-ai/.env` | Authentication and consumption |
| --- | --- | --- |
| Codex | `AI_PROVIDER=codex`, `AI_MODEL=gpt-6-luna` | ChatGPT workspace login; consumes that workspace's available Codex allowance. |
| API | `AI_PROVIDER=openai-api`, `AI_MODEL=<model available to your API project>` | Separate OpenAI Platform project token; consumes separately funded API credit/billing. |

**For Codex**, verify the intended workspace, remaining allowance and extra
spending controls in your ChatGPT/Codex account before enabling inference.
This application cannot enforce the account's billing settings. It never buys
credits, changes those settings or falls back to an API key.

If the host Codex CLI is already logged in with the intended ChatGPT account:

```bash
python3 local-ai/codex-auth.py
./local-ai/compose up -d bridge
./local-ai/compose exec -T bridge codex login status
```

The helper copies only authentication data into the private `codex-auth` volume,
prints its workspace/account ID and binds `CODEX_WORKSPACE_ID` to that ID. It
rejects an existing conflicting workspace setting. No host configuration,
repository, hooks, MCP connections or Docker socket are mounted.

Alternatively, authenticate the container directly using the official device
flow (enable device login for the workspace if required):

```bash
./local-ai/compose exec bridge codex -c 'cli_auth_credentials_store="file"' login --device-auth
./local-ai/compose exec -T bridge node -e 'console.log(JSON.parse(require("fs").readFileSync("/auth/auth.json")).tokens.account_id)'
```

Put the displayed ID in `CODEX_WORKSPACE_ID`. Complete authentication yourself
in the browser. If device login is unavailable, run `codex login` on the host
and use the helper. The volume retains login and CLI token refresh across
restarts. For revoked/expired access, repeat authentication and recreate the
bridge; application data stays intact. Treat a copied host login as a bootstrap:
its subsequent token refresh is independent, and copying an old host login may
require signing in again. Do not share the volume or its contents.

**For the API**, first check the correct project's balance and billing on
[OpenAI Platform](https://platform.openai.com/settings/organization/billing/overview).
ChatGPT subscription quota or Codex credits do not fund API requests. Create a
restricted project token in [API keys](https://platform.openai.com/api-keys),
then save its value, with no quotes or prefix, in the ignored file
`local-ai/.local/openai-api-key`. Keep this file readable only by your user
(`chmod 600 local-ai/.local/openai-api-key`). Never paste the token into Flowise.
On Linux, ensure the runtime secret is readable by container UID 1000 without
making it world-readable. Confirm available prepaid credit and an acceptable
test budget before enabling this mode. Budget alerts are not a hard spending
cap. If you require zero additional spend and cannot verify funding and account
controls, keep inference disabled. Creating a key does not provide free credit.

After configuring either mode, set `INFERENCE_ENABLED=true` in `.env`, then:

```bash
./local-ai/compose up -d --build bridge
```

Always use the wrapper for provider changes: it selects the matching image
build target and mounts. API mode contains no Codex executable and mounts no
Codex authentication; Codex mode receives no Platform token. Switching modes
also requires selecting an accessible model; model entitlements can differ.
To add a provider, implement `generate(prompt, { signal })` in
`local-ai/bridge/providers/` and register it in `providers/index.mjs`.

### Execute and read the trace

Open [Flowise](http://localhost:3000). Its generated login is in
`local-ai/.local/flowise-account.json`. Open **Local AI — Codex or API** under
Agentflows and fill in `requestId` and `prompt` in its test form. Or run:

```bash
python3 local-ai/flowise.py run \
  --request-id local-demo-001 \
  --prompt 'Reply with exactly LOCAL_AI_OK. Do not use tools.'
python3 local-ai/trace.py local-demo-001
```

The result contains text, provider, model, status, duration, available usage,
provider request ID and `traceUrl`. Log into [Langfuse](http://localhost:3001)
with `local@example.test` and `LANGFUSE_ADMIN_PASSWORD` from `.env`, choose the
**Local AI workflow** project and follow `traceUrl`. The persisted generation
includes input/output and `metadata.requestId` for correlation. `trace.py`
independently reads that generation without running inference.

A request ID is 8–100 letters, digits, underscores or hyphens. Reuse the **same
ID and prompt** after a client timeout to retrieve the stored result without a
new inference. Changed input, provider or configured model with the same ID
returns a conflict. Use a new ID only for an intentional new inference.

The bridge permits one inference at a time, at most 16,000 prompt characters
and 90 seconds of runtime. API output is bounded to 1,024 tokens; Codex uses
its model's output limits and a 2 MB local event-stream bound. Execution, browser, file, plugin and MCP tools are
disabled; Codex runs with a read-only sandbox, no approval escalation, an empty
working directory and no personal configuration. The bridge is non-root with
a read-only root filesystem. Only Flowise (127.0.0.1:3000) and Langfuse
(127.0.0.1:3001) publish host ports. The bridge/databases are private. Flowise's
HTTP deny list allows the bridge's exact 172.30.81.10 address while retaining
the upstream private-address exclusions for other destinations. Change the
subnet and generated deny list together if your networks overlap.

`traceStatus=accepted` means Langfuse accepted ingestion; use `trace.py` or the
UI to verify persistence. On tracing failure, the result remains stored with
`traceStatus=pending`; a background outbox retries every 15 seconds without
rerunning inference. A timeout or interrupted execution is `unknown`, because
the remote provider may have consumed usage. It is never automatically rerun.
Token counts are observed usage, not a subscription charge. Cached tokens are
separated from uncached input in Langfuse. Codex models use a `codex/` prefix
there to avoid presenting an API price estimate as ChatGPT billing.

### Stop, restart and troubleshoot

```bash
./local-ai/compose stop
./local-ai/compose up -d
# Recreate containers while retaining existing application data and login:
./local-ai/compose up -d --force-recreate
./local-ai/compose logs --tail 80 bridge flowise langfuse-web langfuse-worker
```

Named volumes retain both PostgreSQL databases, Flowise encryption/storage,
bridge results/outbox, Codex login, ClickHouse, Redis and MinIO. Keep `.env` and
`.local` alongside these volumes. Do not use `down -v` unless you intend to
delete the installation. Back up secrets and volumes securely before upgrades;
container recreation is not a backup strategy. Prompts/responses are retained
in local workflow and trace storage; use non-sensitive trial inputs.

- Authentication/model/quota errors: verify the selected account and model,
  reauthenticate when needed, then use a new request ID for an intentional retry.
  There is no provider fallback. A `busy` response can be retried with the same ID.
- Connection/startup errors: wait for health checks, inspect service logs and
  verify ports, internet connectivity, Docker memory and the network subnet.
- Pending trace: verify Langfuse and storage health, then repeat `trace.py`.
  Repeating the same workflow ID/input retrieves its result without another call.
- `install` preserves the existing imported flow and user edits. Keep
  `.local/flowise-id` to reconnect to it; an import does not overwrite it.
- Avoid sharing full Compose configuration or logs without checking for secrets.

Offline adapter/failure tests require Node 24 or newer:

```bash
node --test local-ai/bridge/test/*.test.mjs
```

The initial live Codex run returned `LOCAL_AI_OK` through Flowise and its
Langfuse generation was independently read, including usage and duration.
Container recreation retained the flow, login, trace and identical stored
result. Both adapters have controlled contract/failure tests. The API image
and secret isolation were checked; **live API inference has not been verified**
because no separately funded API token/test budget was supplied.

This stack uses Flowise's Apache-2.0 community functionality and Langfuse's MIT
core, without enterprise features. PostgreSQL uses its PostgreSQL license,
ClickHouse Apache-2.0, Redis **7.2** BSD-3-Clause, and MinIO AGPL-3.0. These
licenses do not make model inference or Docker Desktop licensing free.
Before an on-premise deployment, review the exact image/dependency licenses,
particularly MinIO AGPL obligations and separately licensed enterprise code,
and provide TLS, access control, secret management, backups, retention, upgrade
and capacity policies. Public/multi-user deployment is outside this trial.

Sources: [Codex authentication](https://learn.chatgpt.com/docs/auth),
[Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode),
[OpenAI Responses API](https://developers.openai.com/api/docs/guides/text),
[Flowise Agentflow V2](https://docs.flowiseai.com/using-flowise/agentflowv2),
[Langfuse Docker Compose](https://langfuse.com/self-hosting/deployment/docker-compose),
[Langfuse OpenTelemetry](https://langfuse.com/integrations/native/opentelemetry).
