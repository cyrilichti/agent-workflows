# Refine Standalone Branch

## Steps

### 1. Resolve Official Parent Context

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Then run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided provider item ID, when available
fields:
  - comments
  - labels
  - linked resources
  - attachments
```

Require the official core fields, including acceptance criteria present in
the item content, current labels, complete comments, and supported linked
resources and attachments. Mark unsupported information explicitly as
unavailable. Stop when supported required information cannot be read.

Use the returned item and provider ID as the complete official parent context.
Present with `../templates/ticket-summary.md`:

```text
item: complete official parent item
```

### 2. Assess Refinement Need

Run `../commands/assess-refinement-need.md` with:

```text
context: complete official parent item
```

On `refinement-not-needed`, report the rationale and finish according to
`../goals/refine-complete.md`. On `needs-refinement`, keep the exact findings.

### 3. Follow Shared Execution

Follow `./refine-confirm.md` with:

```text
provider: resolved item provider
parent_item: complete official parent item
needs_refinement_findings: exact assessment findings
```
