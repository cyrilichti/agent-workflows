# Assess Refinement Need

Assess whether context represents one delivery unit or multiple autonomous
units.

## Input

- `context`: complete task or official item context to assess.

## Steps

1. Reuse `../skills/planning-and-task-breakdown/SKILL.md` when already loaded
   in this workflow run; otherwise load it completely. Use only its autonomy,
   dependency, and vertical-slicing guidance; ignore all drafting and output
   guidance.
2. Treat the context as `needs-refinement` only when it contains multiple
   independently deliverable or schedulable units. Multiple steps, technical
   layers, or sequential changes may remain one unit.
3. Return exactly one outcome with concise findings:
   - `refinement-not-needed`: one coherent delivery unit;
   - `needs-refinement`: multiple independently deliverable or schedulable
     units.

Return only the assessment; do not draft, decompose, persist, or mutate items.
