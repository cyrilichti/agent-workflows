# Transition Item Status

Move one official item to `in progress`, `review`, or `done`.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.
- `target_status`: `in progress`, `review`, or `done`.
- `mode`: `resolve` or `apply`, default `apply`; `resolve` is only valid for
  `done`.
- `resolved_target_status`: exact status returned by a prior `done` resolution,
  required when applying that transition.

## Steps

1. Validate the input and load
   `../providers/<provider>/transition-item-status.md`.
2. Use its read operation to obtain the current status and available statuses
   as `id`, `name`, and `category`: `active`, `review`, `completed`, or `other`.
3. Resolve candidates:
   - `in progress`: prefer one case-insensitive exact name, otherwise use
     `active` statuses;
   - `review`: use `review` statuses;
   - `done`: use `completed` statuses.
4. Apply the target policy:
   - `in progress`: stop on no match; on multiple matches, ask the user to
     select one with `../templates/select-option.md`;
   - `review`: require one match, otherwise return a non-transitioned result;
   - `done`: return a successful no-op when already completed; otherwise
     require one match without asking the user.
5. For `done` in `resolve` mode, return the current and resolved statuses
   without mutation.
6. For `done` in `apply` mode, require `resolved_target_status` to still match
   the single candidate.
7. Use the adapter's apply operation to update only the status.

For ambiguous `in progress` candidates, ask:

```text
question: Which status should be used for in progress?
options:
- label: <provider status name>
  value: <provider status ID or name>
```

Return `transitioned`, `already_at_target` for `done`, `previous_status`,
`target_status`, `resolved_target_status`, `resulting_status`, and a `reason`
on failure. An `in progress` read, resolution, or update failure stops; `review`
and `done` return their failure as best-effort results.

Never update another item field.
