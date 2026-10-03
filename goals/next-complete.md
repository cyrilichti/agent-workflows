# Next Complete

## Outcome

One oldest currently eligible item is identified, or the completed provider
search establishes that no eligible item exists.

## Success Criteria

- The configured item provider was used across all pages and destinations.
- The returned item was individually verified as open and exactly tagged
  `agent-shaped`.
- A found response contains only `name`, `id`, and `url`; an empty response is
  exactly `{ "status": "no eligible item" }`.
- No item, repository, plan, or delivery state was changed.

## Stop Conditions

- Stop after returning the found or empty result.
- Stop and report a provider or incomplete-search error without returning an
  empty result.
