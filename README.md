# my-agentic

Using top external skills without adopting their authors' workflows.

I own the steps, their transitions, and their input/output templates.

Each step activates one or more specialized sub-agents, which route the managed
or adopted Skills selected for their responsibility.

## Skills

The router selects a step automatically when intent is clear and asks for a
supported entry point when it is ambiguous.

### `/write`

Creates or reformulates one item. A writer dynamically routes the relevant Skills. `/write` confirms the proposal, saves it through the resolved
provider, then always offers an optional assignment choice.

### `/pick`

Selects item from the configured provider. It loads and summarizes it, triggers `/plan`, moves the item to in progress and triggers `/work`.

### `/plan`

Creates an approved plan before implementation. Completes missing task context
through the interviewer, activates the adapted technical sub-agent, and writes
a Cursor-compatible plan file.

`/plan` stays autonomous: it can run alone without item.

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

Install this repository and expose its project entry points:

```bash
git submodule add https://github.com/seeren/my-agentic.git .agents
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/CLAUDE.md CLAUDE.md
ln -s .agents/.cursor .cursor
ln -s .agents/skills-lock.json skills-lock.json
```

Restore the managed external Skill dependencies:

```bash
npx skills experimental_install
```

Dependencies are therefore  
restored directly into `.agents/skills/`, and their directories remain ignored  
by the submodule.

## MVP Roadmap

### Steps

- [x] `/write`: create or reformulate exactly one item, confirm it, save it,
  optionally assign it, and stop.
- [ ] `/pick`: select and summarize a backlog item, trigger `/plan`, activate
  the item after approval, then trigger `/work`.
- [ ] `/plan`: create and approve a plan standalone or when called by another
  workflow; return to the caller without triggering `/work`.
- [ ] `/work`: execute the plan and trigger `/ready` on success.
- [ ] `/ready`: run completion gates, then return to `/work` or trigger
  `/review`.
- [ ] `/review`: run an independent review, then return to `/work` or trigger
  `/done`.
- [ ] `/done`: execute configured delivery actions and support
  `blocked/retry` recovery.



### Catalog and Contracts

- [x] Provide shared sub-agent selection and activation.
- [x] Select and record the managed external Skills in `skills-lock.json`.
- [ ] Connect each sub-agent to the relevant installed skills.
- [ ] Add the input/output templates required by each step.
- [ ] Route requests automatically and prevent fallback outside the catalog.