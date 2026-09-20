# publish-review

Follow exactly one verdict branch.

## Request Changes

Require at least one finding. Use GitLab draft notes so the findings and the
`requested_changes` verdict are published together as one review:

1. Create each finding in stable order with `glab api --hostname <host>
   --method POST` against
   `projects/<encoded_path>/merge_requests/<iid>/draft_notes`:
   - With a valid GitLab inline anchor, create one draft diff note using the
     exact finding body as `note` and the complete `position` object with
     `--field`.
   - Without a valid inline anchor, create one general draft note using the
     exact finding body as `note` and no position. Do not combine findings.
2. Parse each response and retain every created draft-note identity.
3. Publish the drafts once with `glab api --hostname <host> --method POST
   --raw-field reviewer_state=requested_changes` against
   `projects/<encoded_path>/merge_requests/<iid>/draft_notes/bulk_publish`.
   GitLab publishes anchored drafts as inline discussions and unanchored
   drafts as general discussions while setting the review verdict.
4. Parse and return the grouped publication response with the draft-note
   identities for caller observation.

## Approve or Comment

For `approve` and `none`, do not create draft notes. Create each finding in
stable order with `glab api --hostname <host>` against
`projects/<encoded_path>/merge_requests/<iid>/discussions`:

- With a valid GitLab inline anchor, create one inline discussion using the
  exact finding body and complete `position` object with `--field`.
- Without a valid inline anchor, create one general discussion using the exact
  finding body and no position. Do not combine findings.
- Parse each response and return its discussion and note identities for caller
  observation.

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

For `none`, stop after publishing the findings. When there is no finding and
the verdict is `none`, perform no mutation.

Pass every value as a separate process argument. On a failed or ambiguous
draft note, grouped publication, discussion, or approval result, stop without
retrying, deleting, editing, publishing drafts individually, or falling back
to another transport. Return every attempted finding and verdict result,
including identities already created before a later failure.
