# Refine Item Branch

## Entry Condition

Run only when the caller supplies:

- `provider`: resolved item provider;
- `parent_item`: complete official parent item;
- `needs_refinement_findings`: exact findings that established the need for
  refinement.

---

## Steps

### 1. Complete the Refinement Context

Apply the complete refinement context contract from `./refine.md`. When any
required information is missing, run `../commands/read-item.md` with the
resolved provider, official parent ID, and only the missing fields. Preserve
supplied fields and known empty results.

When information was added, run `../commands/assess-refinement-need.md` again
with the completed context. On `refinement-not-needed`, report the rationale
and finish according to `../goals/refine-complete.md`. On `needs-refinement`,
replace the caller findings with the reassessed findings.

### 2. Follow Shared Execution

Follow `./refine-confirm.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
needs_refinement_findings: exact caller findings
```
