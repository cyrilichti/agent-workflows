# Hotfix

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/hotfix-complete.md
```

---

## Input

| Input | Description |
| --- | --- |
| `report` | Available urgent bug report. |
| `destination reference` | Explicit destination when present. |
| `current project name` | Active project name when present. |

## Steps

### 1. Resolve the Destination

Run from this file's directory with the explicit destination reference or
current project name, if available. Omit `reference` when neither exists:

```sh
node ../commands/resolve-item-destination.ts <<'JSON'
{"reference":"<destination reference or current project name>"}
JSON
```

On `needs_reference` or `not_found`, ask for a more precise destination and
repeat. On `ambiguous`, ask with `../templates/select-option.md` using each
returned candidate's readable `label` and internal `value`; include `Refine
destination reference` when all matches are only `possible`. On refinement,
repeat with the new reference. On failure, report `stage` and `reason`, then
stop.

### 2. Draft the Item

Use the supplied report directly. Ask one focused question only when missing
information prevents identifying the failure or the intended correction.
Otherwise draft immediately. Do not inspect code, infer a technical cause,
or invoke `/write` qualification or reformulation loops.

Write a concise title and Markdown body describing the symptom, impact,
expected result, and how to verify the correction when known. Retain supplied
reproduction steps and evidence. Omit unknown optional details rather than
asking for them or inventing facts.

### 3. Save the Item

Once the destination and required report information are available, create the
item with the drafted title and body and the selected destination. Run once
from this file's directory:

```sh
node ../commands/save-item.ts <<'JSON'
{"mode":"create","title":"<drafted title>","body":"<drafted Markdown body>","destination":<selected destination JSON>}
JSON
```

On failure, report `stage` and `reason`, then stop. On `saved`, retain the
save result and continue with the saved `item_id`.

### 4. Apply Labels

Run from this file's directory for the required label:

```sh
node ../commands/apply-item-label.ts <<'JSON'
{"item_id":"<saved item ID>","label":"agent-shaped"}
JSON
```

Require `applied: true`. On failure, report the saved item and returned
`reason` and `stage` when available, then stop without invoking `/pick`.

Then run the same command for the tracking label:

```sh
node ../commands/apply-item-label.ts <<'JSON'
{"item_id":"<saved item ID>","label":"hotfix"}
JSON
```

Report the saved item with its link when available and both label results. If
`hotfix` fails, report the returned `reason` and `stage` when available, but
continue to `/pick`.

### 5. Continue to Pick

Follow `./pick.md` with:

```text
item: saved item ID
```
