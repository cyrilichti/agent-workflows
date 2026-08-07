# Linear Provider

## resolve-item-status

Use `list_teams`, then `list_issue_statuses` for each team, and return every
matching `team` and `state` pair for `semantic_status`. If teams or states
cannot be listed, report resolution as unavailable. Do not retrieve issues.

## create-child-item

Create the confirmed issue as a sub-issue in the official parent issue's
destination:

```text
tool: save_issue
arguments:
  team: official parent destination team ID
  project: official parent destination project ID, when provided
  parentId: official parent issue ID
  title: confirmed child title
  description: confirmed child free-form Markdown body
```

Use the team and optional project from the official parent context. Do not
resolve or select another destination. Omit assignment, state, labels, and
other optional fields. This operation creates only the child issue and must not
update the parent issue.

## create-blocking-relations

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

## add-request-backlink

```text
tool: create_comment
arguments:
  issueId: item ID or identifier
  body: exact caller-provided backlink comment
```

Create only the comment. Do not update issue state or any other issue field.
Use this operation only after creating a new request and never during resumed
work.
