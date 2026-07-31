# Find Request

Find an existing open draft merge request for a work branch.

## Input

- `provider`: resolved version-control provider.
- `project_id`: GitLab project ID or URL-encoded path.
- `source_branch`: expected work branch.
- `target_branch`: expected merge target branch.
- `title`: exact expected draft title.

## Steps

1. Load `../providers/<provider>.md`.
2. Use `search-requests` with the project, title, and open state.
3. Keep only results whose title exactly equals `title`.
4. For each remaining result, use `read-request`.
5. Keep only merge requests whose source and target branches exactly match the
   supplied branches and whose state is open.
6. Return:
   - `not-found` when no merge request matches;
   - the complete merge request when exactly one matches;
   - `ambiguous` with the candidates when more than one matches.

Do not choose heuristically between multiple candidates and do not create a
merge request in this command.
