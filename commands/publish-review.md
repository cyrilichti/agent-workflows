# Publish Review

Publish one confirmed review and observe its provider result.

## Input

- `provider`: resolved version-control provider.
- `repository`: resolved provider repository.
- `request_id`: exact pull-request number or merge-request IID.
- `head_sha`: confirmed review snapshot SHA.
- `operations`: ordered confirmed comments and optional terminal verdict. Each
  operation contains its workflow-owned ID tied to the request, head SHA, and
  finding, plus its kind, body, and optional anchor.

## Result

Return every operation as `succeeded`, `unsupported`, `failed`, or `unobserved`.
An operation succeeds only when matching provider state is observed.

## Steps

1. Run `./read-request.md` with `fields: review_activity`, require the request
   to remain open and non-draft, and require its head SHA to equal `head_sha`.
2. Append `<!-- agent-workflows-review:<operation ID> -->` to each operation
   body. Treat it as already complete only when that exact marker is observed
   on this request and SHA.
3. Load `../providers/<provider>.md` and use `publish-review` for the remaining
   operations in their supplied order.
4. After any ambiguous provider result, read complete review activity before
   continuing. Continue only when the exact operation is observed.
5. Stop dependent writes after a failed or unobserved prerequisite.
6. Read complete review activity after publication and return the observed
   result of every operation, including partial failure and unsupported kinds.

Do not retry automatically, edit existing comments, change code or request
content, merge, push, or infer an alternate provider operation.
