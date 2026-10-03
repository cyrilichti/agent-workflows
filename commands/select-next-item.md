# Select Next Item

Find the oldest eligible official item without an item reference.

## Input

- `provider`: resolved item provider.

## Steps

1. Load `../providers/<provider>/select-next-item.md`. Stop when it is missing.
   Use its `List` and `Read` operations, which return normalized `id`, `name`,
   `url`, `labels`, `status` (`open` or `ineligible`), and `created_at` when the
   provider supplies it.
2. Call `List` for items matching the exact `agent-shaped` label or tag across
   the configured provider, without a project, team, list, or assignee scope.
   Follow each page's `next` value while `has_more` is true. Stop on a failed
   call, missing pagination metadata, or a missing or repeated continuation.
   Remove repeated item IDs.
3. Keep records whose labels contain exactly `agent-shaped` and whose status is
   `open`. For each record without `created_at`, use `Read` to obtain it.
   Discard records that became ineligible. Stop on a failed read or a missing
   creation timestamp for an otherwise eligible record.
4. Sort by creation timestamp ascending, then by item ID ascending. Compare
   timestamps as instants and IDs lexically.
5. Use `Read` again on each sorted candidate until one still has the exact
   label and `open` status. Continue past a stale candidate; stop on a failed
   read. Return its current `{name, id, url}`.
6. Return `{ "status": "no eligible item" }` when no candidate remains. A
   provider failure is an error, not an empty result.
