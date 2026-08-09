# Publish Review

Publish confirmed findings as one provider review and observe its result.

## Input

- `provider`: resolved version-control provider.
- `repository`: resolved provider repository.
- `request_id`: exact pull-request number or merge-request IID.
- `head_sha`: confirmed review snapshot SHA.
- `findings`: confirmed complete findings in stable order, including valid
  anchors when available.
- `verdict`: exactly `request_changes`, `approve`, or `none`.

## Result

Return the grouped review, every finding, and the semantic verdict as
`succeeded`, `unsupported`, `failed`, or `unobserved`. The review succeeds only
when its complete matching provider state is observed.

## Steps

1. Run `./read-request.md` with `fields: delivery_state` and require the request
   to remain open and non-draft. When its head SHA differs from `head_sha`,
   return `stale` without mutation.
2. Load `../providers/<provider>/publish-review.md` and run it once with the
   exact findings, verdict, and head SHA. Stop when it is missing.
3. When the provider reports that no mutation was attempted, return its
   unsupported results without another read.
4. Read complete review activity once after the publication attempt. Require
   the new provider review or note identity returned by the mutation, every
   finding body and destination, and any supported semantic verdict to be
   observed together. Never use an older matching body as proof of this
   publication.
5. Return the observed grouped-review, finding, and verdict results. Preserve
   failed, ambiguous, unsupported, and unobserved outcomes without retrying.

Do not create operation markers. Do not retry automatically, edit existing
comments, change code or request content, merge, push, or infer an alternate
provider operation.
