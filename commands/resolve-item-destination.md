# Resolve Item Destination

Resolve the provider-specific destination for a new item.

## Input

- `provider`: resolved item provider.
- `query`: destination reference supplied by the user.

## Steps

1. Load `../providers/<provider>/list-destinations.md`. If the file is missing,
   stop.
2. Follow the loaded operation with the query. The provider operation resolves
   its native URLs, identifiers, and names and returns creatable candidates
   with:
   - a readable `label`;
   - the provider-specific internal `value`;
   - `match`: `native_url`, `exact_id`, `normalized_exact_name`,
     `strong_unique_approximate`, or `possible`.
3. Treat every match except `possible` as reliable. If exactly one reliable
   candidate is returned, return it without confirmation.
4. If several reliable candidates are returned, ask with
   `../templates/select-option.md`:

   ```text
   question: Where should the item be created?
   options:
   - label: <candidate label; repeat for each reliable candidate>
     value: <candidate internal value>
   ```

   Return the selected destination.
5. If no reliable candidate is returned but possible candidates exist, ask
   with `../templates/select-option.md`:

   ```text
   question: Where should the item be created?
   options:
   - label: <candidate label; repeat for each possible candidate>
     value: <candidate internal value>
   - Refine destination reference
   ```

   Return the selected destination. On refinement, collect a new reference and
   repeat from Step 2.
6. If no candidate is returned, ask for a more precise reference and repeat
   from Step 2.

Normalize names for comparison by trimming, case-folding, and collapsing
whitespace and common separators. A strong approximate match must differ only
by a minor spelling, spacing, separator, or word-order variation and have no
similarly close alternative.
