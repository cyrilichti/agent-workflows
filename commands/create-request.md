# Create Request

Create one draft merge request through the configured version-control provider.

## Input

- `provider`: resolved version-control provider.
- `project_id`: GitLab project ID or URL-encoded path.
- `source_branch`: pushed work branch.
- `target_branch`: merge target branch.
- `title`: confirmed title beginning with `Draft:`.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `create-request`.
3. Create one merge request with the supplied project, branches, and title.
4. Return its IID, title, state, source branch, target branch, and URL.

Do not add a description, change ticket state, assign reviewers, or create
another merge request when recovery has already returned one match.
