# Assess Refinement Need

Assess whether context represents one delivery unit or multiple autonomous
units.

## Input

- `context`: complete task or official item context to assess.

## Steps

1. Load `../skills/planning-and-task-breakdown/SKILL.md` completely and use it
   only for this assessment.
2. Return exactly one outcome with concise findings:
   - `refinement-not-needed`: one coherent delivery unit;
   - `needs-refinement`: multiple independently deliverable or schedulable
     units.

Multiple steps, technical layers, or sequential changes may remain one unit.

Return only the assessment; do not draft, decompose, persist, or mutate items.
