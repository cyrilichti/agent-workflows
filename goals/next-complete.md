# Next Complete

## Outcome

One item matching the provider's selection query is identified, or that query
returns no item.

## Success Criteria

- The configured item provider was queried once without a destination scope.
- The returned item is the first result of its provider-native filter for
  `agent-shaped` work.
- A found response contains only `name`, `id`, and `url`; an empty response is
  exactly `{ "status": "no eligible item" }`.
- No item, repository, plan, or delivery state was changed.

## Stop Conditions

- Stop after returning the found or empty result.
- Stop and report a provider error without returning an empty result.
