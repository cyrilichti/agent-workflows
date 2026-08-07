# Refine

## Purpose

Resolve one official parent item as refinement context, whether the item is
supplied by another workflow or selected in standalone mode, then verify in
standalone mode that it contains multiple autonomous delivery units and draft
those units as provider-neutral child proposals for complete user
confirmation before creating them as native children.

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
reference: user-provided provider item ID, when available
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

### 8. Review the Complete Decomposition

Review the complete draft before presenting it. Confirm that:

- it contains at least two child proposals;
- every child has a meaningful title and sufficiently defined free-form
  Markdown body;
- every child remains independently deliverable or schedulable;
- the children cover the complete parent scope exactly once, without omissions
  or overlapping ownership;
- every blocking edge references an existing child, has no self-reference, and
  represents a genuine blocking relationship between autonomous children;
- the blocking graph contains no cycle.

If the draft fails any check, return the complete draft and concise review
findings to the same specialist selected in Step 6. Have that specialist revise
the decomposition under the Step 7 constraints, then repeat this review.

Do not invoke `/write`, `item-writer`, or another specialist to repair a child
proposal.

### 9. Preview and Confirm the Decomposition

Present the complete reviewed draft using
`../templates/decomposition-preview.md`, then ask for one decision using
`../templates/decomposition-confirmation.md`.

Handle the decision as follows:

- `Adjust the decomposition`: collect the requested changes, return them with
  the complete current draft to the same specialist, then repeat Step 8 and
  present a new complete preview for confirmation;
- `Cancel without changes`: report cancellation and stop without changing the
  provider or creating child items;
- `Confirm and create all child items`: preserve exactly the child titles,
  bodies, stable local references, and blocking edges shown in the latest
  preview as the confirmed decomposition, then continue.

Do not support partial confirmation. Do not create or update provider items
during this review and confirmation cycle.

### 10. Create the Confirmed Child Items

Run this step only after Step 9 returns `Confirm and create all child items`.
Do not run it after `Adjust the decomposition`, `Cancel without changes`, or
any earlier terminal outcome.

For each child in the stable order of the confirmed preview, run
`../commands/create-child-item.md` exactly once with:

```text
provider: resolved item provider
parent: complete official parent item with its provider ID and destination
content:
  title: exact confirmed child title
  body: exact confirmed child Markdown body
```

Associate each command result with the child's stable local reference. Preserve
the returned child ID, title, link, destination, and parent ID when available.

If one child fails, record its stable local reference, title, and failure, then
continue with the remaining confirmed children. Do not retry automatically,
create a replacement, roll back children already created, or create an
unparented item.

Pass only the confirmed title and body to the creation command. Keep blocking
edges as workflow metadata until Step 11; do not add them to a child body or
let the child-creation command mutate relationships outside its native parent
relation.

### 11. Create the Confirmed Blocking Relations

Run this step only for confirmed blocking edges whose blocked and blocking
children were both created successfully.

Resolve every stable local child reference exclusively through the child
creation results from Step 10. Do not search the provider or infer an ID from a
title.

For each created child that has one or more confirmed blockers, run
`../commands/create-blocking-relations.md` exactly once with:

```text
provider: resolved item provider
blocked_item_id: provider ID of the blocked child
blocking_item_ids:
  - provider ID of each successfully created blocking child
```

When either endpoint of a confirmed edge was not created, record that relation
as failed without calling the provider operation. If relation creation fails,
record each failed relation and continue with the remaining confirmed
relations. Do not retry automatically or remove relations already created.

### 12. Report the Terminal Outcome

Report exactly one terminal outcome:

- `complete`: every confirmed child and blocking relation was created. Report
  every created child title, provider ID, and link when available, plus every
  created blocking relation;
- `cancelled`: the user selected `Cancel without changes` in Step 9. Report
  that no child was created;
- `failed`: no confirmed child was created. Report every failed child title
  and failure;
- `partially-failed`: at least one child was created, but a confirmed child or
  blocking relation failed. Report the created children, failed children,
  created relations, and failed relations separately.

After reporting, stop `/refine`. Do not retry failures, claim complete success
after any failure, or modify the official parent item.

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
- Do not present an incomplete, overlapping, or scope-incomplete decomposition
  for confirmation.
- Do not treat an earlier preview as confirmed after the specialist revises it.
- Do not create a child that was not included in the latest confirmed preview.
- Do not change the official parent's content, status, assignment, labels,
  destination, or relationships.
- Do not create a blocking relation that was not included in the latest
  confirmed preview.
- Do not create a cyclic blocking graph.
- Do not resolve relation endpoints through provider search or documentation.
- Do not delete or modify a successfully created child to compensate for
  another child's failure.

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
  - the user has cancelled a reviewed decomposition and the workflow has
    stopped without provider mutation;
  - every confirmed child and blocking relation has been created natively and
    `complete` has reported every created child and relation;
  - no confirmed child has been created and `failed` has reported every
    failure;
  - at least one confirmed child has been created but a child or blocking
    relation has failed, and `partially-failed` has reported created and failed
    children and relations separately without retry or rollback;
- the official parent item has remained unchanged.
