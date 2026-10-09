# Reconcile Inspection Publication

Compare one complete inspection result with the frozen review activity before
publication.

## Input

- `head_sha`: frozen request SHA.
- `findings`: every validated finding in stable order.
- `review_activity`: complete activity from the frozen snapshot.

## Steps

1. Treat a finding as already published only when one observed review activity
   entry contains its exact ID and `head_sha` marker.
2. Return every other finding as `unseen_findings` in its original order.

Never match activity from another SHA or infer a finding from unstructured
prose.
