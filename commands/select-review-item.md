# Select Review Item

Select one provider item ID for work awaiting review.

## Input

- `provider`: resolved item provider.
- `reference`: optional exact provider item ID.
- `query`: optional title or narrow title phrase.

## Steps

1. Validate and return `reference` when present. For a URL, ask for an exact ID
   or narrow title phrase instead.
2. When `query` is present, continue at Step 4. Otherwise, resolve
   `semantic_status: review` with `./resolve-item-status.md`. When criteria are
   available, retrieve at most 10 candidates with `./retrieve-items.md` using
   those exact criteria, no assignee criterion, all display fields, and
   `allow_empty: true`. Otherwise continue with no candidates.
3. Ask from the retrieved candidates with `../templates/select-option.md`:

   ```text
   question: Which item do you want to use?
   options:
   - label: <candidate title, status, and destination; repeat and omit when none>
     value: <provider item ID>
   - Enter an exact item ID
   - Search by title
   ```

   Return a selected candidate or entered ID. On title search, continue with
   the supplied phrase as `query`.
4. Search `query` once with `./search-items.md`. Return a single exact title
   match; never infer an approximate match. Otherwise ask with the same
   candidate format plus `Enter an exact item ID` and `Refine title search`.
   Return the selection, or replace `query` and repeat this step.

Stop on partial or failed retrieval or search. Candidates are not official
item context.
