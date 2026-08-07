# Refine Item Branch

## Entry Condition

Run only when the caller supplies:

- `provider`: resolved item provider;
- `parent_item_id`: official parent item ID;
- `parent_item`: complete official parent item;
- `needs_refinement_findings`: exact findings that established the need for
  refinement.

---

## Steps

### 1. Preserve Context

Preserve every supplied field unchanged. Do not resolve the provider again or
search, select, reread, reformulate, summarize, or reassess the parent item.

### 2. Follow Shared Execution

Follow `./refine-confirm.md` with:

```text
provider: resolved item provider
parent_item_id: official parent item ID
parent_item: complete official parent item
needs_refinement_findings: exact caller findings
```
