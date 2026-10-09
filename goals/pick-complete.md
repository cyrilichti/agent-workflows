# Pick Complete

## Outcome

One official item is either recognized as already planned or summarized and
routed from its planning result.

## Success Criteria

- Official current labels determined the route: an item with `agent-planned`
  stopped before planning; otherwise one `agent-shaped` item was summarized.
- `/pick` enforced the open-status condition once on the initially resolved
  official item for reference, title-search, and candidate-selection entries.
  An item whose openness was not confirmed stopped before summary and planning.
- The approved plan was published on the item and `agent-planned` was applied
  before delivery started.
- An approved plan and the complete official item context returned by `/plan`
  were handed directly to `/work`, which owns item activation.
- A `needs-refinement` result left the parent item unchanged by `/pick`,
  honored the user's refinement choice, and stopped before implementation.
- Observed provider results were reported without inferring a successful
  mutation.

## Stop Conditions

- Stop successfully after continuing with `/work` from an approved plan.
- Stop successfully after the selected `needs-refinement` outcome completes.
- Stop successfully before planning when the selected item already contains
  `agent-planned`.
- Stop successfully before summarizing when the initially resolved item is not
  open.
- Stop and report when a required operation fails.

## Human Validation

The refinement offer requires an explicit user choice.
