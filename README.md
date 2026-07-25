# my-agentic

Using top external skills without adopting their authors' workflows.

I own the steps, their transitions, and their input/output templates.

Each step activates one or more specialized sub-agents, which route the managed
or adopted Skills selected for their responsibility.

## Documentation

Start with the [documentation overview](./docs/README.md):

- [Workflows](./docs/workflows/README.md)
- [Skills](./docs/skills.md)
- [Installation](./docs/installation.md)

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