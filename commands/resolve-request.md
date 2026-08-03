# Resolve Request

Resolve one exact open request.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `source_branch`: optional expected source branch.
- `request_id`: optional provider-native merge-request IID or pull-request
  number already known by the caller.
- `request_backlinks`: optional URLs read from an official item.
- `require_non_draft`: optional boolean, default `false`.

A caller may provide an already known `request_id`.

## Steps

1. When `request_id` is absent and `request_backlinks` are available, load
   `../providers/<provider>.md` and use `resolve-request-backlinks` to keep only
   request IDs belonging to that provider and exact repository.
2. Use the backlink result only when it contains one unique request ID.
   Otherwise, ask the user for the exact pull-request number or merge-request
   IID. Do not list or search requests.
3. Run `./read-request.md` with that exact request ID.
4. Require the normalized request `state` to be `open`.
5. When `source_branch` is supplied, require an exact match.
6. When `require_non_draft` is `true`, require `draft: false`.
7. On any mismatch, stop with the observed request and exact diagnostic. Do
   not resolve a substitute.
8. Return the complete provider-neutral request record.

Do not search for requests, infer a target branch or title, choose another
request, or create a request in this command.
