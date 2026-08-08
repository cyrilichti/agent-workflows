# Update Request

Apply one provider-neutral promotion mutation to an existing open request.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `request_id`: provider-native merge-request IID or pull-request number.
- `action`: exactly `replace-description` or `mark-ready`.
- `body`: exact replacement body, required only for `replace-description`.

## Result

- `succeeded`: the requested postcondition was already true or is true after
  the mutation;
- `unsupported`: the required provider operation is unavailable and the
  postcondition was not already true;
- `failed`: the mutation failed or its requested postcondition was not reached.

## Steps

1. Reject any `action` other than the two allowed values, a missing `body` for
   `replace-description`, or a `body` supplied for `mark-ready`.
2. Run `./read-request.md` and require the request state to be `open`.
3. For `replace-description`:
   1. Return `succeeded` without mutation when the current `body` exactly
      equals `body`.
   2. Load `../providers/<provider>/update-request.md` and run it with only
      `replace-description` and the exact replacement `body`.
   3. If the adapter reports that this operation is unavailable, return
      `unsupported` with its exact reason.
   4. Run `./read-request.md` again. Return `succeeded` when its `body` exactly
      equals `body`; otherwise return `failed` with the observed record.
4. For `mark-ready`:
   1. Derive the ready title by removing exactly one leading `Draft:` prefix
      and its following whitespace from the current title. Otherwise preserve
      the title unchanged.
   2. Return `succeeded` without mutation only when the current `draft` is
      `false` and the title already equals the ready title.
   3. Load `../providers/<provider>/update-request.md` and run it with
      `mark-ready` and the ready title only when it differs.
   4. If the adapter reports that this operation is unavailable, return
      `unsupported` with its exact reason.
   5. Run `./read-request.md` again. Return `succeeded` when its `draft` is
      `false` and its title equals the ready title; otherwise return `failed`
      with the observed record.

If a provider mutation fails, return `failed` with the complete observed
request record when one is available. Never merge descriptions, combine both
actions in one provider call, change the title except to remove its exact
leading `Draft:` prefix during `mark-ready`, change the target branch or state,
or retry automatically.
