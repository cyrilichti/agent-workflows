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
- [x] `/refine`: analyze one oversized item, propose and confirm a decomposition
  into autonomous items, save them through the configured provider, and stop.
- [x] `/pick`: select and summarize an item, trigger `/plan`, activate
  the item after approval, then trigger `/work`.
- [x] `/plan`: create and approve a plan standalone or when called by another
  workflow; return to the caller without triggering `/work`.
- [x] `/work`: create a draft MR for new work, execute the plan todo by todo
  with confirmed commits, run its global validation, then hand successful work
  to `/ready`.
- [x] `/ready`: verify completed work against its plan, confirm before pushing,
  promote its request for human review, report the optional item transition,
  and stop.
- [x] `/review`: independently review one request snapshot, curate and confirm
  every finding, publish the observed result, and stop.
- [ ] `/done`: execute configured delivery actions and support
  `blocked/retry` recovery.
