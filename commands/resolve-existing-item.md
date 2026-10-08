# Resolve Existing Item

Resolve one existing official item from a configured provider.

## Input

- `provider`: resolved item provider.
- `reference`: optional user-provided provider item ID or native item URL.
- `query`: optional caller-provided item title or short title search phrase.
- `candidate_criteria`: optional criteria used only when neither reference nor
  query is supplied.
- `eligibility_criteria`: optional conditions applied once to the resolved
  official item for every entry mode.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. When `reference` is available, load
   `../providers/<provider>/resolve-item-reference.md` and normalize the exact
   provider ID or native URL. Stop when the URL belongs to another provider.
   Run `./read-item.md` with the normalized ID and caller-requested fields.
   Continue to Step 5 with the official item and its provider ID.
2. When neither `reference` nor `query` is available, remove any assignment
   criterion from `candidate_criteria`, then run `./retrieve-items.md` with the
   remaining criteria, all display fields, a limit of 5, and `allow_empty:
   true`. Ask using
   `../templates/select-option.md` with every returned candidate plus `Search
   by title`. Return the selected candidate through Step 4, or continue with
   the supplied title phrase as `query`.
3. Run `./search-items.md` once with `query`, then handle the tolerant result:
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
4. Run `./read-item.md` with the resolved provider, selected provider ID, and
   caller-requested fields.
5. Apply `eligibility_criteria` once to the official item returned by
   `read-item`, regardless of whether it was resolved by reference, title
   search, or candidate selection. For `status: open`, use the provider's
   native status type or closed indicator returned with the item; completed,
   canceled, duplicate, or closed types are ineligible. Do not infer openness
   from a workspace-specific status name. Return an ineligible item with the
   failed criterion and observed status so the caller can identify it and
   stop. Otherwise, return the eligible official item and its provider ID.

All candidates are hints only. Only the final `read-item` result is official
context.
