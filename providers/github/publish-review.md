# publish-review

Publish all supplied findings as one pull-request review at the caller's frozen
head SHA.

1. Create one pending review. Put every finding without a valid inline anchor
   in its body, in stable order, using each exact finding body separated only
   by a blank line.
2. Add every finding with a valid inline anchor to that pending review with its
   exact body, finding ID, path, line, side, range, and subject type.
3. Submit that same pending review once. Map `request_changes` to
   `REQUEST_CHANGES`, `approve` to `APPROVE`, and `none` to transport-only
   `COMMENT`.

Return the submitted review's provider identity with the publication response
for caller observation. On a failed or ambiguous create, comment, or submit
result, stop without retrying, deleting, or reusing the pending review. Do not
create issue comments.
