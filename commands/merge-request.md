# Merge Request

Merge one exact request through the configured version-control provider and
return the observed result.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity.
- `request_id`: exact provider-native pull-request number or merge-request IID.
- `merge_method`: optional provider-supported method selected by the caller.

## Steps

1. Load `../providers/<provider>/merge-request.md`. Stop when it is missing.
2. Run it with the exact repository, request ID, and optional merge method.
3. After an attempted merge, run `./read-request.md` with
   `fields: delivery_state`.
4. Return exactly one normalized result:
   - `merged` only when the observed request state is `merged`;
   - `blocked` when the provider rejects the merge because the request is not
     currently eligible;
   - `unsupported` when the configured provider exposes no merge operation;
   - `failed` when the merge operation fails without an observed merge;
   - `unobserved` when the operation may have succeeded but the resulting
     request state cannot be read conclusively.

Include the observed request record when available and a concise provider
reason for every result other than `merged`.

Do not retry, select another request, use another provider operation, or infer
that a successful tool call means the request was merged without observing its
state.
