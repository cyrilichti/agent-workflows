# Create Request

Create one draft request through the configured version-control provider.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `source_branch`: pushed work branch.
- `target_branch`: merge target branch.
- `title`: confirmed title beginning with `Draft:`.

## Steps

1. Load `../providers/<provider>/create-request.md`. Stop when it is missing.
2. Run the operation with the supplied input.
3. Create one request with the supplied repository, branches, and title.
4. Return one provider-neutral request record containing:
   - `request_id`: provider-native merge-request IID or pull-request number;
   - `kind`: `merge_request` or `pull_request`;
   - `title`;
   - `state`: normalized to `open`, `merged`, or `closed` when available;
   - `draft`;
   - `source_branch`;
   - `target_branch`;
   - `body`: request description normalized to an empty string when absent;
   - `url`.

Do not add a description, change ticket state, assign reviewers, or create
another request when recovery has already returned one match.
