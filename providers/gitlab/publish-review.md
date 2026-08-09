# publish-review

When findings exist, call `create_merge_request_note` once with the repository,
merge-request IID, and every finding in stable order using each exact finding
body separated only by a blank line. Return the mutation response for caller
observation, including the created note's provider identity.

Return `request_changes` and `approve` as unsupported; native verdicts are
unavailable through the verified GitLab MCP. When there is no finding, perform
no mutation. If the notes operation is unavailable, return every finding as
`unsupported`. On a failed or ambiguous result, stop without retrying. Do not
substitute REST, CLI, quick actions, inline discussions, or another provider
operation.
