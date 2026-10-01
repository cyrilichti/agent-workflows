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

Run Flowise and Langfuse locally, with Codex or the OpenAI API for inference.
Requires **Docker with Compose 2.24+** and **Node 22.12+**. On Apple Silicon,
this stack was tested with approximately 10 GB of Docker memory.

### Start

From the repository root:

```bash
npm run start
```

This creates the root `.env`, builds and starts the services, waits for them,
imports the example workflow and reuses an existing host Codex login when
available. Existing secrets, workflows and Docker volumes are retained,
including installations created with the previous `local-ai/` layout.
No `npm install` is needed for these Docker commands.

- **Flowise:** http://localhost:3000 — open **Agentflows → Local AI — Codex or API → Chat**.
- **Langfuse:** http://localhost:3001 — open **Local AI workflow → Tracing**.
- **Both logins:** open the private `.local/access.json` file.

For a new installation, check your Codex allowance, set
`INFERENCE_ENABLED=true` in `.env`, then run `npm run start` again.
If no Codex login is available, run `npm run login` and follow its instructions.

Enter a unique `requestId` (such as `my-first-run-001`) and a prompt in Flowise.
The response includes its Langfuse trace link. Reusing the same ID and prompt
returns the saved response without another inference.

### Everyday commands

| Command | Action |
| --- | --- |
| `npm run start` | Set up, start or apply configuration changes |
| `npm run stop` | Stop all services, keeping data |
| `npm run logs` | Show recent service logs |
| `npm run login` | Refresh Codex authentication |
| `npm run test` | Run local tests without model calls |
| `npm run doc` | Open the documentation website (requires `npm install`) |

### Configuration

Edit the **root `.env`**, then run `npm run start`. Choose exactly one provider:

| Setting | Codex subscription | OpenAI API |
| --- | --- | --- |
| `COMPOSE_PROFILES` | `codex` (default) | `openai-api` |
| `AI_MODEL` | `gpt-6-luna` | A model available to your API project |
| `OPENAI_API_KEY` | Leave empty | Your Platform project token |
| `INFERENCE_ENABLED` | `true` after checking allowance | `true` after checking API funding |

API billing is separate from ChatGPT. There is no automatic provider fallback
or credit purchase. The API adapter has controlled tests; live API inference
has not been verified with a funded token. Codex login stays in its own Docker
volume and is not mounted into the API service.

<details>
<summary>How it works and troubleshooting</summary>

There is **one `compose.yaml` at the repository root**. Docker assets and
initialization code live in `.docker/`. Its Dockerfile installs the pinned
runtime once during build; dependencies are not reinstalled on every startup.
The two Compose profiles select separate Codex/API images and credentials.

Only Flowise (port 3000) and Langfuse (port 3001) are exposed, on localhost.
The bridge is private, runs as non-root with a read-only root filesystem, and
permits one inference at a time. Flowise 3.1.4, Langfuse 4.48.0, PostgreSQL 17.6,
ClickHouse 25.12, Redis 7.2.6 and MinIO are pinned in Compose; the Codex image
uses CLI 0.159.2. Model inference requires internet access.

- On startup errors, check Docker is running, ports 3000/3001 are free, and
  inspect `npm run logs`. The workflow network uses `172.30.81.0/24`.
- For expired/revoked Codex access, authenticate again on the host and run
  `npm run login`. This preserves workflow data. The container refreshes its
  own copy of the login; it does not mount your personal Codex configuration.
- `traceStatus=pending` means the trace will be retried without repeating
  inference. `unknown` means an interrupted request may have consumed usage;
  reuse its ID to read its saved state. `accepted` means ingestion accepted;
  verify the observation in Langfuse. Subscription token counts are not API costs.
- Keep `.env`, `.local/` and named Docker volumes together for recovery.
  `docker compose down -v` deletes data. Back up before upgrading, and avoid
  sharing configuration/logs containing secrets or private prompts.

This is a trusted local trial. Flowise has announced its
[end of life](https://flowiseai.com/sunset); evaluate maintenance before a
production deployment. Community licenses: Flowise Apache-2.0, Langfuse MIT
core, PostgreSQL PostgreSQL License, ClickHouse Apache-2.0, Redis 7.2 BSD-3-Clause,
MinIO AGPL-3.0. Enterprise features, Docker Desktop licensing and model usage
have separate terms. Production also requires access control, TLS, backups
and retention policies.

The documentation website remains available with `npm run doc` (after
`npm install`); its build and preview commands are unchanged.

</details>
