# Resolve Existing Item

Resolve one existing official item from a configured provider.

## Input

- `provider`: resolved item provider.
- `reference`: optional user-provided item ID or URL.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. When `reference` is available, run `./read-item.md` with the resolved
   provider, the item ID or URL, and the caller-requested fields. Return the
   official item and its provider ID, then stop this command.
2. Otherwise, ask the user for the item title or a short title search phrase,
   then run `./search-items.md` with the resolved provider and that query. Do
   not list every item available from the provider.
3. Handle the search result:
   - If no item matches, ask the user to refine the search or stop. Repeat the
     search only when the user provides a refined phrase.
   - If exactly one item matches, select it.
   - If multiple items match, ask the user to select one using
     `../templates/select-option.md`. Use readable labels with title, status,
     and destination when available, and attach the provider ID as the internal
     value.
4. Run `./read-item.md` with the resolved provider, selected provider ID, and
   caller-requested fields.
5. Return the official item and its provider ID to the caller.

## Failure Behavior

- Do not treat a search result as official item content before reading it.
- Do not expose provider IDs in selection labels.
- Do not silently broaden the user's search phrase.
- If the selected item cannot be read, stop without substituting another
  result.
