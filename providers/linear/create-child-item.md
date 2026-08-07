# create-child-item

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
