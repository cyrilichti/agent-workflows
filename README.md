# my-agentic

Using top external skills without adopting their authors' workflows.

I own the steps, their transitions, and their input/output templates.

Each step activates one or more adapted sub-agents, and each sub-agent points
to the installed skills I have selected.

## Skills

The router selects a step automatically when intent is clear and asks for a
supported entry point when it is ambiguous.

### `/write`

Creates or improves a backlog item. It resolves the provider, collects only
missing information, renders the item with template, asks for confirmation,
then saves and optionnaly assigns it.

### `/pick`

Selects an official, startable backlog item from the configured provider. It
loads and summarizes the source context with ticket template, then triggers
`plan`. The item becomes active only after planning succeeds.

### `/plan`

Completes missing task context through the interviewer, activates the adapted
technical sub-agent, and creates a plan with template cursor rendering
compatible. Once the plan is approved, it triggers `work`.

### `/work`

Activates the implementation sub-agent and its selected skills, then executes
the approved plan. A blocker stops the flow; successful implementation triggers
`ready`.

### `/ready`

Runs the required completion gates, including relevant tests, static checks,
and acceptance criteria. A failure returns findings to `work`; success triggers
`review`.

### `/review`

Activates an independent reviewer that does not modify the implementation.
Requested changes return to `work`; approval triggers `done`.

### `/done`

Depending on the configuration, it can merge the source pull request, create a
tag or release, notify the right people, update the backlog item, or open a
downstream pull request for client-facing changes such as push notifications.

Required actions are idempotent and their resulting links and identifiers are
reported. An operational failure stays in `blocked/retry`;

## Installation

Install this repository as the project's `.agents/` directory:

```bash
git submodule add https://github.com/seeren/my-agentic.git .agents
```

Install the pinned external Skill dependencies:

```bash
cd .agents
npx skills experimental_install
```

Expose thin adapters at the project root:

```bash
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/CLAUDE.md CLAUDE.md
ln -s .agents/.cursor .cursor
```

Project-specific knowledge stays in the consuming project, typically under  
`docs/`.

## MVP Roadmap

### Steps

- [x] `/write`: create or improve an item, confirm it, save it, and stop.
- [ ] `/pick`: expose the existing backlog selection and trigger `/plan`.
- [ ] `/plan`: trigger `/work` after the plan is approved.
- [ ] `/work`: execute the plan and trigger `/ready` on success.
- [ ] `/ready`: run completion gates, then return to `/work` or trigger
  `/review`.
- [ ] `/review`: run an independent review, then return to `/work` or trigger
  `/done`.
- [ ] `/done`: execute configured delivery actions and support
  `blocked/retry` recovery.

### Catalog and Contracts

- [x] Provide shared sub-agent selection and activation.
- [ ] Select, install, and pin the external skills in `skills-lock.json`.
- [ ] Connect each sub-agent to the relevant installed skills.
- [ ] Add the input/output templates required by each step.
- [ ] Route requests automatically and prevent fallback outside the catalog.
