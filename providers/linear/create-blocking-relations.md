# create-blocking-relations

Create every confirmed blocking relation for one newly created child issue:

```text
linear issue relation add <blocked child issue ID> blocked-by <blocking child issue ID> --no-input
```

Run once for each blocking child issue ID. Stop and report any failed relation;
do not claim that the full set was created after a partial failure.

Use the complete list of blocking child issue IDs supplied by the caller.
`blockedBy` means the issue identified by `id` cannot start until those issues
are complete.

Use only the child issue IDs supplied by the caller. Do not search for issues
or provider documentation and do not inspect tool schemas at runtime. The CLI
resolves the supplied IDs before creating each relation.

This operation applies only to a newly created child issue and must not update
its official parent.
