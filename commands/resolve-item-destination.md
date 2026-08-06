# Resolve Item Destination

Resolve the provider-specific destination for a new item.

## Input

- `provider`: resolved item provider.
- `query`: destination name or path phrase.

## Steps

1. Require a non-empty `query`. If missing, stop and ask for one.
2. Load `../providers/<provider>/list-destinations.md`. If the file is missing,
   stop.
3. Follow the loaded operation with that query only. Do not list every
   destination.
4. When the provider marks a candidate `confirmation_required`, ask the user to
   confirm its readable label or refine the expression. Return it only after
   confirmation.
5. Return matching creatable destinations with a readable label and internal
   value each.

If none match, ask for a more precise expression. Do not choose implicitly.
If several match, return them for explicit selection.
