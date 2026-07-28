# Assess Refinement Need

Determine whether task context represents one coherent delivery unit or needs
refinement into multiple autonomous units.

## Input

- `context`: complete task or official item context to assess.

## Steps

1. Load `../skills/planning-and-task-breakdown/SKILL.md` completely and use it
   only for this assessment.
2. Return one outcome:
   - `refinement-not-needed` with a concise rationale when the context
     represents one coherent delivery unit;
   - `needs-refinement` with concise findings when it contains multiple
     independently deliverable or schedulable units.

Multiple implementation steps, technical layers, or sequential changes inside
one coherent delivery unit do not require refinement. Treat blocking
relationships as evidence only when they connect autonomous units.

Do not draft a plan, decomposition, child proposal, todo list, or local file.
Do not mutate provider items.
