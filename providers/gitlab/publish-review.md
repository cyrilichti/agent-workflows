# publish-review

Publish findings in stable order through `glab api --hostname <host>` against
`projects/<encoded_path>/merge_requests/<iid>/discussions`:

- Create each finding with a valid GitLab inline anchor as its own inline
  discussion, passing its exact body and complete `position` object with
  `--field`.
- Create each finding without a valid inline anchor as its own general
  discussion with its exact body. Do not combine findings.
- Parse each JSON response and return its discussion and note identities for
  caller observation.

For `approve`, after every finding succeeds, run:

```text
command: glab
arguments:
  - mr
  - approve
  - caller request ID
  - --repo
  - caller repository URL
  - --sha
  - caller head SHA
```

For `request_changes`, publish the findings when present and return the verdict
as `unsupported` with the exact reason `glab exposes no native request-changes
verdict`. For `none`, publish only the findings. When there is no finding and
the verdict is `none`, perform no mutation.

Pass every value as a separate process argument. On a failed or ambiguous
discussion or approval result, stop without retrying, deleting, editing, or
falling back to another transport. Return every attempted finding and verdict
result, including identities already created before a later failure.
