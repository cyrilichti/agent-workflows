# Read Request

Read one GitLab merge request through the configured version-control provider.

## Input

- `provider`: resolved version-control provider.
- `project_id`: GitLab project ID or URL-encoded path.
- `request_id`: merge request IID.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `read-request`.
3. Return the merge request IID, title, state, Draft state, source branch,
   target branch, author, commits when requested, diffs when requested, and URL.

If the merge request cannot be read, stop without substituting another search
result.
