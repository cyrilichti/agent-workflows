# Refine Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Parent item ID, native URL, title, or search phrase when supplied |

---

## Steps

### 1. Resolve the Parent

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/resolve-refine-item.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/resolve-refine-item.ts --query "<item>"
```

On `needs_reference` or `not_found`, ask for a parent reference or a better
title phrase and repeat. On `ambiguous`, ask with
`../templates/select-option.md` using each candidate's title, status, and
destination as its label and `item_id` as its value; rerun with the selected ID.
On failure, report `stage` and `reason`, then stop. Use only the final
`resolved` item as official context. It includes the core fields, labels,
complete comments, attachments, and linked resources; unavailable optional
fields are marked `null`.

Present with `../templates/ticket-summary.md`:

```text
item: complete official parent item
```

### 2. Assess the Parent

From this file's directory, read the rule unless it is already active:

```sh
cat ../rules/refinement-assessment.md
```

Apply it to the complete official parent item, then run with the assessed
units:

```sh
node ../commands/assess-refinement-need.ts <<'JSON'
{"autonomous_units":[{"outcome":"<assessed outcome>","verification":"<check>"}]}
JSON
```

On `refinement-not-needed`, report the findings and stop. On
`needs-refinement`, preserve the exact findings.

### 3. Continue

Follow `./refine-execute.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
needs_refinement_findings: exact assessment findings
```
