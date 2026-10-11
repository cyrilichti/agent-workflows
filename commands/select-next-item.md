# Select Next Item

Return one item from the configured provider without an item reference.

## Input

- `provider`: resolved item provider.

## Eligibility

Select `agent-planned` items waiting to start, or in review without
`agent-inspected`. Provider adapters normalize statuses from the selection
response; skip states whose eligibility cannot be established.

## Steps

1. Load `../providers/<provider>/select-next-item.md`; stop when missing.
   Run its single filtered call without project, team, list, or assignee scope.
2. Use only its first-page candidates: `name`, `id`, `url`, `list`,
   `status_category` (`waiting`, `review`, or `other`), `labels`, and
   `updated_at` (epoch milliseconds). Apply the eligibility rule above.
3. Choose the eligible candidate with the oldest `updated_at`; retain provider
   order for equal timestamps. Return no match when none qualifies.
4. Return its `name`, `id`, `url`, and `list`. A failed call, incomplete candidate
   labels, invalid eligible timestamp, or missing selected destination is an
   error.

Do not follow another page or read individual items.
