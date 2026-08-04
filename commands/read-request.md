# Read Request

Read one request through the configured version-control provider.

## Input

- `provider`: resolved version-control provider.
- `repository`: provider-specific repository identity derived from the push
  remote.
- `request_id`: provider-native merge-request IID or pull-request number.
- `fields`: optional caller-requested fields.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `read-request`.
3. Return the complete provider-neutral request record defined by
   `./create-request.md`, including the normalized `body`, plus author, commits
   when requested, and diffs when requested.

When `fields` contains `delivery_state`, also return:

- the exact request head SHA;
- normalized `state`: `open`, `merged`, or `closed`;
- normalized `merge_status`: `mergeable`, `blocked`, `unknown`, or `merged`;
- the provider-reported merge blocker when available.

When `fields` contains `review_activity`, return the exact head SHA and every
request comment, review discussion, reply, and verdict. Follow every page and
stop if the activity is partial.

When `fields` contains `review_snapshot`, include `review_activity`, the full
diff, complete changed-file set, and valid inline-anchor data. Read the request
again after collecting these fields and stop unless the head SHA is unchanged.
Do not return a partial or stale snapshot.

If the request cannot be read, stop without substituting another search result.
