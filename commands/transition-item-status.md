# Transition Item Status

Move one official item to a normalized workflow status through its configured
provider.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.
- `target_status`: exactly `in progress`, `review`, or `done`.

## Steps

1. Reject any other `target_status`.
2. Load `../providers/<provider>.md`.
3. Use the provider operation named `transition-item-status` with `item_id` and
   `target_status`.
4. For `in progress`:
   - when exactly one workspace status matches, update only the item's state or
     status field;
   - when no status matches, stop without mutation;
   - when multiple statuses match, ask the user to choose one using
     `../templates/select-option.md`, then update only the selected status;
   - return the updated item status, and stop on update failure.
5. For `review`:
   - when exactly one review-like workspace status exists, attempt to update
     only the item's state or status field;
   - when zero or multiple review-like statuses exist, do not mutate and do not
     ask the user to choose;
   - return a report containing `transitioned`, the previous status when
     available, normalized target, resolved target when available, resulting
     status when available, and a reason whenever `transitioned` is `false`.
6. Treat the `review` transition as best-effort. Its missing, ambiguous, or
   failed provider transition must not block the caller's request promotion.

For `done`:

- resolve the next provider state after the current state whose semantic
  meaning is completed or done;
- when the item is already in such a state, return a successful no-op;
- when exactly one next state matches, update only the item's state or status;
- when no state or multiple states match, return a non-transitioned report
  without asking the user to choose;
- return `transitioned`, `already_at_target`, previous state, resolved target,
  resulting state, and a reason whenever neither transition nor successful
  no-op occurred.

Treat `done` as best-effort because its caller may already have completed an
irreversible merge.

Do not change the item's title, description, assignee, labels, project,
relationships, or any other field.
