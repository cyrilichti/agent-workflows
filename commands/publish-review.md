# Publish Review

Publish one confirmed review and observe its provider result.

## Input

- `provider`: resolved version-control provider.
- `repository`: resolved provider repository.
- `request_id`: exact pull-request number or merge-request IID.
- `head_sha`: confirmed review snapshot SHA.
- `operations`: ordered confirmed comments and optional terminal verdict. Each
  operation contains its kind, exact body, and optional anchor.

## Result

Return every operation as `succeeded`, `unsupported`, `failed`, or `unobserved`.
An operation succeeds only when matching provider state is observed.

## Steps

1. Run `./read-request.md` with `fields: review_activity`, require the request
   to remain open and non-draft, and require its head SHA to equal `head_sha`.
2. Load `../providers/<provider>/publish-review.md` and run it for the
   operations in their supplied order. Stop when it is missing.
3. Read complete review activity after each operation and require the exact
   body, anchor, or verdict to be observed.
4. On a failed, ambiguous, or unobserved result, report it and stop dependent
   writes.
5. Return the observed result of every attempted operation, including partial
   failure and unsupported kinds.

Do not create operation markers. Do not retry automatically, edit existing
comments, change code or request content, merge, push, or infer an alternate
provider operation.
