# Reconcile Inspection Publication

Compare one complete inspection result with the frozen review activity before
publication.

## Input

- `head_sha`: frozen request SHA.
- `findings`: every validated finding in stable order.
- `verdict`: `request_changes`, `approve`, or `none`.
- `review_activity`: complete activity from the frozen snapshot.

## Steps

1. Treat a finding as already published only when one observed review activity
   entry contains its exact ID and `head_sha` marker.
2. Return every other finding as `unseen_findings` in its original order.
3. Treat `request_changes` or `approve` as already observed only when the
   corresponding provider verdict is bound to `head_sha`. The `none` verdict
   needs no separate provider verdict.
4. Return `complete` without publication when every finding and required verdict
   is already observed.
5. Return `partial` when no blocking finding remains unseen but
   `request_changes` is not observed. This state cannot be repaired without
   duplicating a finding.
6. Otherwise return `publish` with `unseen_findings` and the semantic verdict.

Never match activity from another SHA or infer a finding from unstructured
prose.
