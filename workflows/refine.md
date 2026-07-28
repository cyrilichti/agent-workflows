# Refine

## Purpose

Resolve one official parent item as refinement context, whether the item is
supplied by another workflow or selected in standalone mode, then verify in
standalone mode that it contains multiple autonomous delivery units and draft
those units as provider-neutral child proposals.

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

### 5. Prepare Decomposition Context

Continue refinement with exactly one resolved provider, official parent item
ID, and complete official parent item.

Preserve the caller's `needs-refinement` findings in workflow mode or the
standalone refinement findings produced by Step 4.

### 6. Resolve Decomposition Author

Run `./sub-agent.md` with the complete official parent item and preserved
refinement findings.

Select exactly one appropriate specialist for the parent scope. The selected
specialist is the sole decomposition author. It may inspect relevant technical
context explicitly identified by the item or user, but it must not modify that
context or the provider.

### 7. Draft the Child Decomposition

Have the selected specialist load `../skills/to-tickets/SKILL.md` completely
and use only its vertical-slicing and blocking-edge methods.

Give the specialist:

- the complete official parent item;
- the preserved refinement findings;
- any relevant read-only technical context inspected in Step 6;
- the instruction to return a provider-neutral draft containing two or more
  child proposals.

Each child proposal must contain:

- a stable local reference;
- one meaningful title;
- one free-form Markdown body;
- references to other proposed children only when they genuinely block it.

Require the draft to satisfy all of these conditions:

- every child is independently deliverable or schedulable;
- children are vertical slices rather than isolated technical layers;
- the children cover the complete parent scope exactly once, without omissions
  or overlapping ownership;
- blocking edges connect autonomous children and do not represent ordinary
  implementation ordering inside one child.

Override and suppress `to-tickets` instructions to:

- run tracker setup or choose a tracker;
- fetch, search for, reread, or modify the official parent item;
- quiz the user or approve the decomposition;
- write ticket files or any other local file;
- publish, create, update, or label provider items;
- create native blocking, sub-issue, or other provider relationships;
- commit, hand off, or start implementation.

Return the draft to `/refine`. Do not present it as approved and do not create
any child item during this step.

---

## Safety

- Do not treat pasted text, a title, or a search result as an official parent
  item.
- Do not repeat provider resolution or item retrieval in workflow mode.
- Do not repeat the refinement-need assessment in workflow mode.
- Do not mutate the provider while resolving refinement context.
- Do not propose a decomposition or create child items while assessing whether
  refinement is needed.
- Do not let more than one specialist author the decomposition.
- Do not let `to-tickets` own provider setup, persistence, labels,
  relationships, confirmation, or local files.

---

## Success Criteria

This refinement stage is complete when:

- the entry mode is explicit;
- one resolved provider, official parent item ID, and complete official parent
  item are available;
- context has been acquired according to the entry mode:
  - workflow mode has preserved the caller context and findings unchanged
    without provider retrieval or a repeated refinement-need assessment;
  - standalone mode has resolved, read, and summarized one official item
    through the shared existing-item command, then used
    `../commands/assess-refinement-need.md` to determine whether it contains
    multiple autonomous delivery units;
- one of these outcomes has been reached:
  - a coherent standalone item has returned `refinement-not-needed` and stopped
    without provider mutation, decomposition, or child creation;
  - an oversized item has preserved concise refinement findings, exactly one
    appropriate specialist has used `to-tickets` to return at least two
    autonomous provider-neutral vertical child proposals with genuine blocking
    edges, and those proposals cover the parent scope exactly once without any
    tracker setup, provider mutation, label, relationship, local file,
    confirmation, handoff, or implementation side effect.
