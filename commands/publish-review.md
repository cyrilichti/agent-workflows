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
`succeeded`, `unsupported`, `failed`, or `unobserved`. After an attempted
publication, also return the observed request `delivery_state` when available.

## Steps

1. Run `./read-request.md` with `fields: delivery_state` and require the request
   to remain open and non-draft. When its head SHA differs from `head_sha`,
   return `stale` without mutation.
2. Load `../providers/<provider>/publish-review.md` and run it once with the
   exact findings, verdict, and head SHA. Stop when it is missing.
3. When the provider reports that no mutation was attempted, return its
   unsupported results without another read.
4. Otherwise, read once with both `review_activity` and `delivery_state`.
   Match the mutation's new provider identity, every finding body and
   destination, and any supported verdict. Return their observed results plus
   the request delivery state; an older matching body is not proof.

Do not retry, create markers, edit existing comments or request content, or
infer another provider operation.
