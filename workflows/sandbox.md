# Sandbox

## Required Context

Reuse active files. From this file's directory, read the remaining files below
together in one `cat`, omitting active paths; skip when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/user-facing-output.md ../templates/sandbox-context.md
```

## Input

| Input | Description |
| --- | --- |
| `item_id` | Required for preparation. |
| `project_directory` | Absolute main repository path, required for preparation. |
| `browser_validation` | Boolean, required for preparation. |
| `sandbox_context` | When supplied, select teardown instead of preparation. |

## Steps

### 1. Select Mode

Use teardown when `sandbox_context` is supplied; otherwise use preparation.
Stop with an input error when the selected mode's required input is missing.

### 2. Run the Selected Command

Run the command from this file's directory using the selected mode's JSON input
on stdin. Return its JSON result unchanged and end this workflow.

Preparation and teardown command contracts are defined below.
