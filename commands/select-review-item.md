# Select Review Item

Select one provider item ID for a workflow acting on work awaiting review.

## Input

- `provider`: resolved item provider.
- `reference`: optional user-provided exact provider item ID.
- `query`: optional user-provided item title or narrow title phrase.

## Steps

1. When `reference` is available, require a provider item ID and return it. If
   it is a URL, ask for an exact item ID or a narrow title phrase instead.
2. When `query` is available, continue at Step 4.
3. Otherwise, run `./resolve-item-status.md` with `semantic_status: review`.
   When it returns criteria, run `./retrieve-items.md` with those exact
   criteria and:

   ```text
   fields:
     - provider_id
     - title
     - status
     - destination
   limit: 10
   allow_empty: true
   ```

   Do not add an assignee criterion. Ask using
   `../templates/select-option.md` with:

   ```text
   question: Which item do you want to use?
   options:
   - label: <retrieved title, status, and destination; repeat and omit when none>
     value: <provider item ID>
   - Enter an exact item ID
   - Search by title
   ```

   - A selected list value is the provider item ID; return it.
   - On `Enter an exact item ID`, ask for that ID and return it.
   - On `Search by title`, ask for a narrow phrase and keep it as `query`.
4. When `query` is available, run `./search-items.md` once. Return a single
   exact title match. Otherwise, ask using `../templates/select-option.md`
   with:

   ```text
   question: Which item do you want to use?
   options:
   - label: <matched title, status, and destination; repeat and omit when none>
     value: <provider item ID>
   - Enter an exact item ID
   - Refine title search
   ```

   A selected list value is the provider item ID. Ask for and return an exact
   ID when selected. Refining replaces `query` and repeats this step.
5. Return only the selected provider item ID.

On any retrieval or search failure or partial result, report the exact provider
failure and stop. Never select an approximate title match implicitly, including
when only one is available. Retrieval and search results are selection
candidates, not official item context.
