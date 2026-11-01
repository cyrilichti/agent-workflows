# Refinement Assessment

- Return `needs-refinement` only when the context contains multiple useful
  units that can be delivered or verified separately. Prefer vertical slices
  for features. Allow justified expansion, migration, and removal sequences
  when one wide change cannot remain valid as independent vertical slices.
- Return `refinement-not-needed` for one indivisible unit. Multiple steps,
  technical layers, or sequential changes do not justify an artificial split.

Assess the context before calling `assess-refinement-need.ts`. Supply one
coherent unit or each independently useful unit; the command returns the
structured outcome from those assessed units.
