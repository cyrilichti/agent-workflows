# Select Next Item

Return one item from the configured provider without an item reference.

## Input

- `provider`: resolved item provider.

## Eligibility

Only items with the exact `agent-planned` label or tag are eligible when they
are waiting to start, or are in review without the exact `agent-inspected`
label or tag. Each provider adapter translates waiting and review into its
status vocabulary using only the selection response. Skip work in progress,
terminal states, and states whose eligibility cannot be established.

Require complete labels or tags for every waiting or review candidate; a
missing collection is an error, not evidence that `agent-inspected` is absent.
An explicit empty collection is complete and has no `agent-planned` label.

## Steps

1. Load `../providers/<provider>/select-next-item.md`. Stop when it is missing.
2. Run its single filtered selection call across the configured provider,
   without a project, team, list, or assignee scope. Apply the provider's
   status mapping for this eligibility rule to the first returned page.
   Do not follow another page or read individual items.
3. Normalize each eligible item's last-modified timestamp using the adapter's
   field mapping. If any eligible item has a missing or invalid timestamp,
   stop with an error because ordering cannot be established. Select the
   smallest timestamp; equal timestamps retain the original provider order.
   When no eligible item exists, return a no-match result.
4. Return the selected item's `name`, `id`, `url`, and `list`, or a no-match
   result. A failed call or a selected item without a destination name is an
   error, not a no-match result.
