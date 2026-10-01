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

Kestra Open Source provides local orchestration and execution visualization;
Langfuse stores the AI traces. Inference uses Codex or the OpenAI API.
Requires Docker with Compose 2.24+; approximately 10 GB of Docker memory was
used for the local Apple Silicon verification.

```bash
cp .env.example .env
# Fill the credentials and secrets in .env.
docker compose up -d --build
```

- **Kestra:** http://localhost:3000 — `KESTRA_ADMIN_EMAIL` / `KESTRA_ADMIN_PASSWORD`.
- **Langfuse:** http://localhost:3001 — `local@example.test` / `LANGFUSE_ADMIN_PASSWORD`.

The example `local.ai / local_ai` is installed automatically. Its inputs are
`requestId` and `prompt`; execution outputs include the response and trace URL.
Initialization preserves edits made in Kestra. Configuration is documented in
`.env.example`; startup never rewrites `.env`.

For the Codex profile, authenticate once inside the container:

```bash
docker compose exec bridge codex -c 'cli_auth_credentials_store="file"' login --device-auth
```

Stop the services before changing `COMPOSE_PROFILES`, then start them again.
API billing is separate from ChatGPT; live API inference requires your own
funded project token. New installations leave inference disabled until
`INFERENCE_ENABLED=true` is set explicitly.

<details>
<summary>Technical details</summary>

Docker assets are in `.docker/`. Both interfaces are served locally; Kestra
Open Source requires no cloud account or license key. Its SSO, fine-grained
permissions and other Enterprise features are outside this setup.

The private bridge supports one inference at a time and deduplicates identical
request IDs and prompts. Failed or uncertain provider outcomes fail the Kestra
execution; inspect the response task for details. Pending traces are retried
without repeating inference. No automatic provider fallback is configured.

Workflow definitions, execution history, traces and Codex authentication persist
in Docker volumes. Back up the volumes with `.env`; deleting volumes deletes
stored data. Neither the bridge nor Kestra mounts the host repository or Docker
socket. This example performs inference; autonomous repository work is separate.

Kestra 2.0.4 is pinned in `.docker/Dockerfile.kestra`; Langfuse 4.48.0 and
infrastructure images in `compose.yaml`; Codex CLI in `.docker/bridge/Dockerfile`. Model calls
require internet access. Licenses: Kestra Apache-2.0, Langfuse MIT core,
PostgreSQL PostgreSQL License, ClickHouse Apache-2.0, Redis 7.2 BSD-3-Clause,
MinIO AGPL-3.0. Model usage and Docker Desktop have separate terms.

</details>
