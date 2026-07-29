# Branch Name

Use to format the branch created for a selected plan.

## Type

Choose the branch type from the official item type when it is available.
Otherwise, choose it from the plan objective:

| Work type | Branch type |
| --- | --- |
| Feature or story | `feature` |
| Bug or defect | `fix` |
| Refactoring | `refactor` |
| Documentation | `docs` |
| Tests | `test` |
| Continuous integration or delivery | `ci` |
| Build or dependencies | `build` |
| Technical maintenance | `chore` |
| No clear match | `task` |

## Format

With an official item:

```text
<type>/<item-id>-<slug>
```

Without an official item:

```text
<type>/<slug>
```

## Rules

- Preserve the official item ID in a Git-compatible form.
- Build `<slug>` from the plan name as concise lowercase kebab-case.
- Do not use `work` as a systematic branch type.
- Do not inspect existing branches or repository documentation to infer
  another convention.
