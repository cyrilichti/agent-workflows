# Assess Refinement Need

Assess whether context represents one delivery unit or multiple autonomous
units.

## Input

- `context`: complete task or official item context to assess.

## Steps

1. Reuse `../skills/planning-and-task-breakdown/SKILL.md` when already loaded
   in this workflow run; otherwise load it completely. Use only its autonomy,
   dependency, and decomposition guidance; ignore all drafting and output
   guidance.
2. Treat the context as `needs-refinement` only when it contains multiple
   useful units that can be delivered or verified separately. Prefer vertical
   slices for features. Allow justified expansion, migration, and removal
   sequences when one wide change cannot remain valid as independent vertical
   slices.
3. Return `refinement-not-needed` for one indivisible unit. Multiple steps,
   technical layers, or sequential changes do not justify an artificial split.
4. Return exactly one outcome with concise findings:
   - `refinement-not-needed`: one coherent delivery unit;
   - `needs-refinement`: multiple useful units that can be delivered or
     verified separately.

Return only the assessment; do not draft, decompose, persist, or mutate items.
