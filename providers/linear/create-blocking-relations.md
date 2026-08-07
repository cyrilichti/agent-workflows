# create-blocking-relations

Create all confirmed blocking relations for one newly created child issue in
one update:

```text
tool: save_issue
arguments:
  id: blocked child issue ID
  blockedBy:
    - blocking child issue ID
    - each additional blocking child issue ID
```

Use the complete list of blocking child issue IDs supplied by the caller.
`blockedBy` means the issue identified by `id` cannot start until those issues
are complete.

Use only the child issue IDs supplied by the caller. Do not search for issues
or provider documentation and do not inspect tool schemas at runtime. Omit
title, description, parentId, team, project, state, assignee, labels, and every
other field.

This operation applies only to a newly created child issue and must not update
its official parent.
