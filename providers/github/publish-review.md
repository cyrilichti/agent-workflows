# publish-review

- For a request comment, call `add_issue_comment` with the exact body.
- For inline comments, create one pending review at the caller's `head_sha`,
  then call `add_comment_to_pending_review` with each exact body and
  validated path, line, side, range, and subject type.
- Submit the pending review with `pull_request_review_write`, method
  `submit_pending`, using `REQUEST_CHANGES`, `APPROVE`, or `COMMENT` from the
  terminal operation and its exact body. Use `COMMENT` when inline comments
  exist without a terminal verdict.

After each operation, return the observed request activity. On an ambiguous or
unobserved result, stop without retrying, deleting, or reusing a pending review.

