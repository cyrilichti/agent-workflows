# Resolve Item Assignee

Resolve a person who can be assigned to an item.

## Input

- `provider`: resolved item provider.
- `query`: `me`, or a person name or email.

## Steps

1. Require a non-empty `query`. If missing, stop and ask for `me`, a name, or
   an email.
2. Load `../providers/<provider>/resolve-assignees.md`. If the file is missing,
   stop.
3. Follow the loaded operation with that query only. Do not list every member.
4. When the provider marks a candidate `confirmation_required`, ask the user to
   confirm its readable identity or refine the expression. Return it only after
   confirmation.
5. Return matching people with readable names and internal IDs.

If none match, ask for a more precise expression. Do not choose implicitly.
If several match, return them for explicit selection.
