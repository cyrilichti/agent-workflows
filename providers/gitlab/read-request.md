# read-request

```text
command: glab
arguments:
  - api
  - --hostname
  - caller repository host
  - projects/<caller repository encoded_path>/merge_requests/<caller request ID>
```

Run the command once and parse its JSON response. Map `iid` to `request_id`, set
`kind: merge_request`, normalize `opened`, `merged`, and other terminal states,
then return title, native Draft state, source and target branches, author, web
URL, and description normalized to an empty string.

For `delivery_state`, also return the exact head SHA and normalize the native
`detailed_merge_status`, merge-status fields, Draft state, conflicts, pipeline,
approval, and discussion state to `merge_status: mergeable`, `blocked`,
`unknown`, or `merged`. Preserve the native detailed status as the concise
blocker when it identifies one. Treat transient, unchecked, or unrecognized
statuses as `unknown`.

When commits are requested:

```text
command: glab
arguments:
  - api
  - --hostname
  - caller repository host
  - --paginate
  - projects/<caller repository encoded_path>/merge_requests/<caller request ID>/commits
```

When diffs are requested:

```text
command: glab
arguments:
  - api
  - --hostname
  - caller repository host
  - --method
  - GET
  - --raw-field
  - unidiff=true
  - --paginate
  - projects/<caller repository encoded_path>/merge_requests/<caller request ID>/diffs
```

Use the JSON array returned by `glab api --paginate`. Stop when a command exits
non-zero, its output is not valid JSON, or GitLab marks a diff as `collapsed`
or `too_large`; do not return a partial collection.

For `review_activity`, use `glab api --hostname <host> --paginate` for
`projects/<encoded_path>/merge_requests/<iid>/discussions`, and use `glab api`
for both `projects/<encoded_path>/merge_requests/<iid>/approvals` and
`projects/<encoded_path>/merge_requests/<iid>/reviewers`. Return the exact head
SHA, every discussion and nested note or reply, every approval verdict, and
every reviewer state, including `requested_changes`. Stop instead of returning
partial activity when any command fails or returns invalid JSON.

For `review_snapshot`, also read
`projects/<encoded_path>/merge_requests/<iid>/versions`, require its latest
version to match the initial head SHA, and collect all diffs with the paginated
diff command above. Derive the complete changed-file set and inline-anchor data
from each diff's paths and the latest version's base, start, and head SHAs. Read
the merge request again and require the same head SHA before returning the
snapshot. Stop when activity, versions, or diffs are missing, partial,
truncated, collapsed, too large, or stale.

Pass every value as a separate process argument. Do not invoke a shell, retry a
failed command, or recover with another provider or transport.
