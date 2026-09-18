# Change Design

- Before changing an artifact, inspect its relevant context, analogous
  artifacts, and existing conventions.
- Place each responsibility in its architectural owner.
- Reuse an existing shared mechanism when it satisfies the need.
- Define each behavior, constraint, or output mapping once in its owning
  contract. Elsewhere, reference it without restating it.
- Specify constraints, validations, confirmations, or expected outcomes only
  when they affect execution or address genuine uncertainty. Omit conditions
  guaranteed by the surrounding contracts or system design.
- When changing a contract, update its affected producers, consumers, tests,
  and documentation.
- When a change removes or supersedes behavior, trace its dependencies and
  remove the obsolete implementation and supporting artifacts unless a
  supported behavior still depends on them.
