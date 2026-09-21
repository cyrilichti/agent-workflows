# Pick Complete

## Outcome

One official item has been selected and summarized, then routed safely from
its planning result.

## Success Criteria

- The selected item was resolved exclusively through the configured provider
  from an exact ID, native URL, tolerant title match, or open `agent-shaped`
  selection, and its official summary was shown without assignment criteria.
- An approved plan caused the item to move to `in progress` before `/work`
  received the plan and updated official item context.
- A `needs-refinement` result left the parent item unchanged by `/pick`,
  honored the user's refinement choice, and stopped before implementation.
- Observed provider results were reported without inferring a successful
  mutation.

## Stop Conditions

- Stop successfully after continuing with `/work` from an approved plan and a
  successful `in progress` transition.
- Stop successfully after the selected `needs-refinement` outcome completes.
- Stop and report when a required operation fails.

## Human Validation

Ambiguous item selection, plan approval, and any refinement choice require the
explicit user decisions defined by their owning workflows.
