# Pick Complete

## Outcome

One official item has been selected and summarized, then routed safely from
its planning result.

## Success Criteria

- The selected item is an official provider item and its summary was shown.
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

Item selection, plan approval, and any refinement choice require the explicit
user decisions defined by their owning workflows.
