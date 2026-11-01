# Refine Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Parent item ID, native URL, title, or search phrase when supplied |

---

## Steps

### 1. Resolve the Parent

Run `../commands/resolve-item-provider.md`, then
`../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: supplied ID or URL, when available
query: supplied title or search phrase, when available
fields: comments, labels, linked resources, attachments
```

Use the final read result as the complete official parent context. Require
the core fields, including acceptance criteria present in the content,
current labels, complete comments, and supported linked resources and
attachments. Mark unsupported fields unavailable; stop when a supported
required field cannot be read.

Present with `../templates/ticket-summary.md`:

```text
item: complete official parent item
```

### 2. Assess the Parent

Run `../commands/assess-refinement-need.md` with:

```text
context: complete official parent item
```

On `refinement-not-needed`, report the findings and finish under
`../goals/refine-complete.md`. On `needs-refinement`, preserve the exact
findings.

### 3. Continue

Follow `./refine-confirm.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
needs_refinement_findings: exact assessment findings
```
