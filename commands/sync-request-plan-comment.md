# Sync Request Plan Comment

Create or update the single marked plan comment on an exact request.

## Input

- `provider`: resolved version-control provider.
- `repository`: resolved provider repository.
- `request_id`: exact pull-request number or merge-request IID.
- `body`: exact comment body from `../templates/request-plan-comment.md`.
- `plan_comment`: optional carried provider comment identity.

## Steps

1. Require `body` to begin with the `<!-- agent-workflows-plan -->` marker.
2. Read the exact request with `fields: review_activity`.
3. When `plan_comment` is supplied, require that exact request comment to begin
   with the marker. Otherwise select request comments beginning with the marker
   only: create when none exists, reuse the one match, and stop when more than
   one exists.
4. Return `succeeded` without mutation when the selected comment already has
   the exact body.
5. Load `../providers/<provider>/sync-request-plan-comment.md` and create or
   update once with the resolved action, exact body, and selected identity.
6. Read `review_activity` once more. Return `succeeded` only when the returned
   identity belongs to this request and has the exact body; otherwise return
   `failed` or `unobserved` with the mutation result.

Never delete comments, merge bodies, match unmarked comments, or retry a failed
or ambiguous mutation.
