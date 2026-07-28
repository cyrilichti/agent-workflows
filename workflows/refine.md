# Refine

## Purpose

Resolve one official parent item as refinement context, whether the item is
supplied by another workflow or selected in standalone mode, then verify in
standalone mode that it contains multiple autonomous delivery units.

---

## Entry Condition

Run this workflow in one of these modes:

- **Workflow mode**: another workflow calls `/refine` with a resolved provider,
  an official parent item ID, the complete official parent item, and
  `needs-refinement` findings.
- **Standalone mode**: the `refine` Skill is explicitly invoked without caller
  context. Resolve one official parent item before refinement begins.

Treat caller mode as explicit. Pasted item text, a title, or an ID without the
complete caller context does not constitute workflow mode.

---

## Required Context

Refinement requires:

- the resolved item provider;
- the official parent item ID;
- the complete official parent item.

Workflow mode also requires the `needs-refinement` findings supplied by the
caller.

---

## Steps

### 1. Resolve Entry Mode

Use workflow mode only when the caller provides every required workflow-mode
field. Otherwise, use standalone mode.

If an explicit workflow-mode handoff is incomplete, return the missing-context
failure to the caller. Do not silently switch to standalone mode.

### 2. Reuse Caller Context

Skip this step in standalone mode.

Keep the caller-provided provider, parent item ID, complete official item, and
`needs-refinement` findings unchanged as refinement context.

Do not resolve the provider again. Do not search for, select, reread,
reformulate, or summarize the parent item again.

### 3. Resolve Standalone Context

Skip this step in workflow mode.

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Then run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided item ID or URL, when available
fields:
  - comments
  - acceptance criteria
  - labels
  - linked resources
  - attachments
```

Keep the returned provider ID as the official parent item ID and the returned
official item as the complete parent context.

Present the parent item using `../templates/ticket-summary.md`.

### 4. Verify Standalone Refinement Need

Skip this step in workflow mode because the caller's `needs-refinement`
findings already establish this result.

Run `../commands/assess-refinement-need.md` with the complete official parent
item.

On `refinement-not-needed`, report the rationale and stop without changing the
provider or official parent item. On `needs-refinement`, keep its findings as
refinement context and continue.

### 5. Continue With Official Context

Continue refinement with exactly one resolved provider, official parent item
ID, and complete official parent item.

Preserve the caller's `needs-refinement` findings in workflow mode or the
standalone refinement findings produced by Step 4.

---

## Safety

- Do not treat pasted text, a title, or a search result as an official parent
  item.
- Do not repeat provider resolution or item retrieval in workflow mode.
- Do not repeat the refinement-need assessment in workflow mode.
- Do not mutate the provider while resolving refinement context.
- Do not propose a decomposition or create child items while assessing whether
  refinement is needed.

---

## Success Criteria

Context resolution is complete when:

- the entry mode is explicit;
- one resolved provider, official parent item ID, and complete official parent
  item are available;
- workflow mode has preserved the caller context and findings unchanged
  without provider retrieval;
- standalone mode has resolved, read, and summarized one official item through
  the shared existing-item command;
- standalone mode has used `../commands/assess-refinement-need.md` to determine
  whether the official item contains multiple autonomous delivery units;
- a coherent standalone item has returned `refinement-not-needed` and stopped
  without provider mutation, decomposition, or child creation; or
- an oversized standalone item has preserved concise refinement findings and
  continued without proposing a decomposition during the assessment.
