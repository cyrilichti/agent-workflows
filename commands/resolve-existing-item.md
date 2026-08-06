# Resolve Existing Item

Resolve one existing official item from a configured provider.

## Input

- `provider`: resolved item provider.
- `reference`: optional user-provided provider item ID.
- `query`: optional caller-provided item title or short title search phrase.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. When `reference` is available, run `./read-item.md` with the resolved
   provider, the item ID, and the caller-requested fields. Return the
   official item and its provider ID, then stop this command.
2. Otherwise, reuse `query` or ask for an item title or short title phrase,
   then run `./search-items.md`.
3. Handle the search result:
   - If no item matches, ask the user to refine the search or stop. Repeat the
     search only when the user provides a refined phrase.
   - If exactly one item matches, select it.
   - If multiple items match, ask using `../templates/select-option.md` with:

     ```text
     question: Which item do you want to use?
     options:
     - label: <title, status, and destination when available>
       value: <internal provider item ID>
     ```
4. Run `./read-item.md` with the resolved provider, selected provider ID, and
   caller-requested fields.
5. Return the official item and its provider ID to the caller.
