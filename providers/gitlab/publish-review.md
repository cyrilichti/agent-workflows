# publish-review

For a request comment, call `create_merge_request_note` with the repository,
merge-request IID, and exact body. Follow every `after` cursor with
`get_merge_request_notes` to verify the comment after the write. If the result
is ambiguous or unobserved, stop without retrying. If either notes operation is
unavailable, return `unsupported`.

Return `unsupported` for inline comments and native verdicts. Do not substitute
REST, CLI, quick actions, or request-level notes for those operations.

