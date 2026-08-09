# Merge Request

Merge one exact request through the configured version-control provider and
return the observed result.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity.
- `request_id`: exact provider-native pull-request number or merge-request IID.
- `merge_method`: required provider-supported merge method.
- `mode`: `resolve` or `apply`, default `apply`.

## Steps

1. Load `../providers/<provider>/merge-request.md`. Return `unsupported` when
   it is missing.
2. In `resolve` mode, verify without mutation that the adapter exposes a
   writable merge operation supporting `merge_method`. Return `supported` or
   `unsupported` with a concise reason, then stop.
3. In `apply` mode, run the adapter with the exact repository, request ID, and
   merge method.
4. After an attempted merge, run `./read-request.md` with
   `fields: delivery_state`.
5. Return exactly one normalized apply result:
   - `merged` only when the observed request state is `merged`;
   - `blocked` when the provider rejects the merge because the request is not
     currently eligible;
   - `unsupported` when the configured provider exposes no merge operation;
   - `failed` when the merge operation fails without an observed merge;
   - `unobserved` when the operation may have succeeded but the resulting
     request state cannot be read conclusively.

Include the observed request record when available and a concise provider
reason for every result other than `merged`.

Never mutate in `resolve` mode. Do not retry, select another request, use
another provider operation, or infer that a successful tool call means the
request was merged without observing its state.
