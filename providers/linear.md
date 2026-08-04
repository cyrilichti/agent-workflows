# Linear Provider

## retrieve-items

Retrieve Linear issues matching the caller's criteria.

### Current User

1. Retrieve issues assigned to the current user:

   ```text
   tool: list_issues
   arguments:
     assignee: me
     includeArchived: false
     orderBy: updatedAt
     limit: 50
   ```

2. Apply the caller criteria to the returned issues when Linear cannot express
   them directly.

Use Linear state names and state types as workspace-specific values. Do not
assume every workspace uses the same status labels.

### Status Criteria

Use `list_issues` with the caller's resolved `team` and `state`. Do not pass
`assignee` unless the caller requested it. Follow every returned cursor and
fail rather than returning a partial result.

## resolve-item-status

Use `list_teams`, then `list_issue_statuses` for each team, and return every
matching `team` and `state` pair for `semantic_status`. If teams or states
cannot be listed, report resolution as unavailable. Do not retrieve issues.

## search-items

```text
tool: list_issues
arguments:
  query: caller query
  includeArchived: false
  orderBy: updatedAt
  limit: 20
```

Prefer title matches. Return issue ID or identifier, title, state, team,
project,
and URL. Do not paginate unless the user refines the search.

## read-item

```text
tool: get_issue
arguments:
  id: item ID or identifier
```

Return the issue's title, description, state, team, project, assignee, and URL.

Set `includeRelations: true` when linked resources are requested. When comments
are requested, call `list_comments` with `issueId` set to the same issue ID or
identifier. Attachments are returned by `get_issue`.

For `request_backlinks`, call `list_comments`, follow every returned cursor
until no next page remains, and return every `Draft PR:` or `Draft MR:` URL. If
a comments page fails or is truncated, stop without returning the item.

## list-destinations

First list available teams:

```text
tool: list_teams
arguments:
  includeArchived: false
```

A team is required to create an issue. After the team is selected, list its
projects when the user wants to attach the issue to a project:

```text
tool: list_projects
arguments:
  team: selected team ID
  includeArchived: false
```

Return a composite destination containing the required team and optional
project. Keep their IDs internal.

## resolve-assignees

For `me`, preserve the literal value because Linear accepts it directly.

For a name or email:

```text
tool: list_users
arguments:
  query: caller query
  limit: 20
```

Return matching user names and IDs.

## create-item

Serialize the confirmed item sections as Markdown, then create the issue:

```text
tool: save_issue
arguments:
  team: selected destination team
  project: selected destination project, when provided
  title: confirmed title
  description: confirmed free-form Markdown body
```

Omit assignment and state so the caller can handle them separately.

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

## update-item

```text
tool: save_issue
arguments:
  id: item ID or identifier
  title: confirmed title, when changed
  description: confirmed free-form Markdown body, when changed
```

Omit every field that the user did not confirm changing.

## assign-item

```text
tool: save_issue
arguments:
  id: item ID or identifier
  assignee: selected user ID or me
```

Do not include other update fields.

## transition-item-status

Resolve and update a Linear issue status.

1. Read the item to obtain its team:

   ```text
   tool: get_issue
   arguments:
     id: caller item ID or identifier
   ```

2. List the team's available statuses:

   ```text
   tool: list_issue_statuses
   arguments:
     team: item team name or ID
   ```

   For `in progress`, stop if Steps 1 or 2 fail. For `review` or `done`, return
   a non-transitioned best-effort result with the provider failure as its
   reason.

3. Resolve the caller's normalized target by case-insensitive status name and
   Linear status type:
   - for `in progress`, prefer an exact `in progress` name or the single
     non-review active-work equivalent;
   - for `review`, keep only statuses whose name clearly identifies review; do
     not substitute an active-work status or create a status;
   - for `done`, return a successful no-op when the current state type is
     `completed`. Otherwise, keep only available states whose type is
     `completed` or whose name clearly means done or completed.
4. For `in progress`, stop when no status matches and ask the user to select
   one when multiple statuses match equally.
5. For `review` or `done`, continue only when exactly one matching state exists.
   For zero or multiple matches, do not mutate and do not ask the user to
   choose.
6. Update only the issue state when the preceding rules selected one status:

   ```text
   tool: save_issue
   arguments:
     id: caller item ID or identifier
     state: resolved workspace status name or ID
   ```
7. For `in progress`, return the updated issue status and stop on failure.
8. For `review` or `done`, return a best-effort result containing:
   - `transitioned`: `true` only when the update succeeded;
   - `previous_status`: the state read in Step 1 when available;
   - `target_status`: `review` or `done`;
   - `resolved_target_status`: the single matched status when available;
   - `resulting_status`: the updated status when returned or confirmed;
   - `reason`: required when `transitioned` is `false`, including read failure,
     no match, ambiguous matches, or update failure.

For `done`, also return `already_at_target: true` for the successful no-op and
`false` otherwise. Do not let a non-transitioned `review` result block request
promotion or a non-transitioned `done` result hide an already completed merge.

Do not pass title, description, team, project, assignee, labels, or any other
optional `save_issue` field.

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
