# Reconcile Inspection Publication

Compare one complete inspection result with the frozen review activity before
publication.

## Input

- `head_sha`: frozen request SHA.
- `findings`: every validated finding in stable order.
- `review_activity`: complete activity from the frozen snapshot.

## Steps

1. Treat a finding as already published when its exact ID and `head_sha`
   marker occur in the review activity, or when its `Source review` identifies
   an existing entry in that activity.
2. Return every other finding as `unseen_findings` in its original order.

Only `/inspect` decides whether an existing human comment describes a current
defect; this command only prevents duplicate publication.
