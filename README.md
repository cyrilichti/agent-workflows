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

## Agent orchestration

Run Kestra workflows with a local AI bridge and Langfuse traces. Follow the
[orchestration guide](./README.orchestration.md) to configure the services and
run the demo.

To start the documentation development server, install dependencies with
`npm ci`, then run `npm run doc`.
