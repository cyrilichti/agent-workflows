# Find Request

Find an existing open draft request for a work branch.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `source_branch`: expected work branch.
- `target_branch`: expected merge target branch.
- `title`: exact expected draft title.

## Steps

1. Load `../providers/<provider>.md`.
2. Use `search-requests` with the repository, title, and open state.
3. Keep only results whose title exactly equals `title`.
4. For each remaining result, use `read-request`.
5. Keep only requests whose source and target branches exactly match the
   supplied branches, whose normalized state is `open`, and whose `draft` value
   is `true`.
6. Return:
   - `not-found` when no request matches;
   - the complete provider-neutral request record when exactly one matches;
   - `ambiguous` with the candidates when more than one matches.

Do not choose heuristically between multiple candidates and do not create a
request in this command.
