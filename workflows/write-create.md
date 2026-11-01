# Write Create

## Input

| Input | Description |
| --- | --- |
| `intention` | Initial need when present. |
| `destination reference` | Explicit destination when present. |
| `current project name` | Active project name when present. |

## Steps

### 1. Resolve the Destination

Run from this file's directory with the explicit destination reference or
current project name, if available. Omit `reference` when neither exists:

```sh
node ../commands/resolve-write-destination.ts <<'JSON'
{"reference":"<destination reference or current project name>"}
JSON
```

On `needs_reference` or `not_found`, ask for a more precise destination and
repeat. On `ambiguous`, ask with `../templates/select-option.md` using each
returned candidate's readable `label` and internal `value`; include `Refine
destination reference` when all matches are only `possible`. On refinement,
repeat with the new reference. On failure, report `stage` and `reason`, then
stop.

### 2. Collect the Need

Reuse `intention` when it describes the need. Otherwise ask for a short
free-form description.

### 3. Author the Item

Follow `./write-confirm.md` with the returned `provider` and selected
`destination`, `mode: create`, and the need as `intention`.
