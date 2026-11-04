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

Present the proposed title and body:

```markdown
### <item title>

<concise Markdown body>
```

### 3. Confirm and Save

Ask with `../templates/select-option.md`:

```text
question: Create this item and continue to /pick?
options:
- Create item and continue
- Stop without changes
```

Continue only after `Create item and continue`. On `Stop without changes`,
stop. If the user supplies a correction, incorporate it and present the
updated proposal for confirmation.

Run from this file's directory with the confirmed title and body and the
selected destination:

```sh
node ../commands/save-item.ts <<'JSON'
{"mode":"create","title":"<confirmed title>","body":"<confirmed Markdown body>","destination":<selected destination JSON>}
JSON
```

On failure, report `stage` and `reason`, then stop. On `saved`, retain the
save result and continue with the saved `item_id`.
