# agent-workflows

Make the best external skills work together through clear, controlled
workflows.

Each workflow selects the right skills, controls their sequence, and owns
provider operations and approval boundaries.

## Documentation

Start with the [documentation](https://cyrilichti.github.io/agent-workflows/)

## MVP Roadmap

### Steps

- [x] `/write`: create or reformulate exactly one item, confirm it, save it,
  optionally assign it, and stop.
- [ ] `/refine`: analyze one oversized item, propose and confirm a decomposition
  into autonomous items, save them through the configured provider, and stop.
- [x] `/pick`: select and summarize an item, trigger `/plan`, activate
  the item after approval, then trigger `/work`.
- [x] `/plan`: create and approve a plan standalone or when called by another
  workflow; return to the caller without triggering `/work`.
- [ ] `/work`: execute the plan and trigger `/ready` on success.
- [ ] `/ready`: run completion gates, then return to `/work` or trigger
  `/review`.
- [ ] `/review`: run an independent review, then return to `/work` or trigger
  `/done`.
- [ ] `/done`: execute configured delivery actions and support
  `blocked/retry` recovery.
