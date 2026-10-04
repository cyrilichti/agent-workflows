# Next Complete

## Outcome

One eligible item from the provider's selection page is identified, or that
page contains no eligible item.

## Success Criteria

- The configured item provider was queried once without a destination scope.
- The returned item is the first eligible result from the provider's single
  selection page for `agent-shaped` work.
- A found response contains only `name`, `id`, `url`, and `list`; an empty
  response is exactly `{ "status": "no eligible item" }`.
- No item, repository, plan, or delivery state was changed.

## Stop Conditions

- Stop after returning the found or empty result.
- Stop and report a provider error without returning an empty result.
