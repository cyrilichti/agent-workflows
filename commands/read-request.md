# Read Request

Read one request through the configured version-control provider.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `request_id`: provider-native merge-request IID or pull-request number.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `read-request`.
3. Return the complete provider-neutral request record defined by
   `./create-request.md`, including the normalized `body`, plus author, commits
   when requested, and diffs when requested.

If the request cannot be read, stop without substituting another search result.
