# Resolve Request

Resolve one exact open request for the current work branch.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `source_branch`: exact current work branch.
- `request_id`: optional provider-native merge-request IID or pull-request
  number already known by the caller.

A caller may provide an already known `request_id`.

## Steps

1. When `request_id` is absent, ask the user for the pull-request number or
   merge-request IID and wait for the response.
2. Run `./read-request.md` with that exact request ID.
3. Require the normalized request `state` to be `open` and its `source_branch`
   to exactly equal the supplied current `source_branch`.
4. If either check fails, stop with the observed request record and an exact
   diagnostic. Do not resolve a substitute.
5. Return the complete provider-neutral request record.

Do not search for requests, infer or filter a target branch, title, or draft
state, choose another request, or create a request in this command.
