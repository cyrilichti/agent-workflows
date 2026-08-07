# Pick Complete

## Outcome

One official item has been selected and summarized, then routed safely from
its planning result.

## Success Criteria

- The selected item is an official provider item and its summary was shown.
- An approved plan moved the item to `in progress`, then handed its marker,
  plan, and updated item context to `/work` in a fresh context.
- A `needs-refinement` result left the parent item unchanged by `/pick`,
  honored the user's refinement choice, and stopped without handing off to
  `/work`.
- Observed provider results were reported without inferring a successful
  mutation.

## Stop Conditions

- Stop successfully after dispatching or presenting the `/work` handoff.
- Stop successfully after the selected `needs-refinement` outcome completes.
- Stop and report when a required operation fails.

## Human Validation

Item selection, plan approval, and any refinement choice require the explicit
user decisions defined by their owning workflows.
