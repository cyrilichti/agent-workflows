# Resolve Existing Item

Resolve one existing official item from a configured provider.

## Input

- `provider`: resolved item provider.
- `reference`: optional user-provided provider item ID or native item URL.
- `query`: optional caller-provided item title or short title search phrase.
- `candidate_criteria`: optional criteria used only when neither reference nor
  query is supplied.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. Stop when `candidate_criteria` contains an assignment criterion.
2. When `reference` is available, load
   `../providers/<provider>/resolve-item-reference.md` and normalize the exact
   provider ID or native URL. Stop when the URL belongs to another provider.
   Run `./read-item.md` with the normalized ID and caller-requested fields.
   Return the official item and its provider ID, then stop this command.
3. When neither `reference` nor `query` is available, run
   `./retrieve-items.md` with `candidate_criteria`, all display fields, a limit
   of 5, and `allow_empty: true`. Ask using
   `../templates/select-option.md` with every returned candidate plus `Search
   by title`. Return the selected candidate through Step 5, or continue with
   the supplied title phrase as `query`.
4. Run `./search-items.md` once with `query`, then handle the tolerant result:
   - If no item matches, ask the user to refine the search or stop. Repeat the
     search only when the user provides a refined phrase.
   - If exactly one item matches, select it without requiring an exact title.
   - If multiple items match, ask using `../templates/select-option.md` with:

     ```text
     question: Which item do you want to use?
     options:
     - label: <title, status, and destination when available>
       value: <internal provider item ID>
     ```
5. Run `./read-item.md` with the resolved provider, selected provider ID, and
   caller-requested fields.
6. Return the official item and its provider ID to the caller.

All candidates are hints only. Only the final `read-item` result is official
context.
