# Refinement Assessment

- Return `needs-refinement` only when the context contains multiple useful
  units that can be delivered or verified separately. Prefer vertical slices
  for features. Allow justified expansion, migration, and removal sequences
  when one wide change cannot remain valid as independent vertical slices.
- Return `refinement-not-needed` for one indivisible unit. Multiple steps,
  technical layers, or sequential changes do not justify an artificial split.

Return exactly one outcome with concise findings:

- `refinement-not-needed`: one coherent delivery unit;
- `needs-refinement`: multiple useful units that can be delivered or verified
  separately.

Do not draft, decompose, persist, or mutate items while assessing.
