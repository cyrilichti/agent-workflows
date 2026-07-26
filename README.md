# agent-workflows

Use top external skills without adopting their authors' workflows.

Each workflow controls the sequence, selects the right skills, and owns
provider operations and approval boundaries.

## Documentation

Start with the [documentation](./docs/index.md)

## MVP Roadmap

### Steps

- [x] `/write`: create or reformulate exactly one item, confirm it, save it,
  optionally assign it, and stop.
- [x] `/pick`: select and summarize an item, trigger `/plan`, activate
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
