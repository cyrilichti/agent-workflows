# Refine Item Branch

## Entry Condition

Run only when the caller supplies:

- `provider`: resolved item provider;
- `parent_item`: complete official parent item, including core fields and
  acceptance criteria present in its content, current labels, complete
  comments, and supported linked resources and attachments;
- `needs_refinement_findings`: exact findings that established the need for
  refinement.

---

## Steps

### 1. Follow Shared Execution

Follow `./refine-confirm.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
needs_refinement_findings: exact caller findings
```
