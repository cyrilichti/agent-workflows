# Skills

my-agentic is Skills-aware, but it is not a Skill library.

Workflows own what happens and when. Specialized agents use Skills as focused
capabilities inside those workflows.

```text
Workflow owns the journey → Agent selects expertise → Skill guides execution
```

## Workflow Entry Points

Local Skills expose public commands such as `/write`, `/pick`, and `/plan`.
They stay intentionally small and delegate orchestration to the corresponding
[workflow](./workflows/README.md).

This keeps discovery compatible with AI coding agents without duplicating the
workflow inside each Skill.

## Managed Skills

Generic external Skills remain dependencies of their upstream projects. They
are recorded in `skills-lock.json` and restored during
[installation](./installation.md).

The current writing workflow can dynamically select:

- [`interview-me`](https://github.com/addyosmani/agent-skills) when the request
  is still vague;
- [`idea-refine`](https://github.com/addyosmani/agent-skills) when the expected
  behavior needs exploration;
- [`grilling`](https://github.com/mattpocock/skills) when decisions need to be
  challenged;
- [`to-spec`](https://github.com/mattpocock/skills) when the user explicitly
  wants a complete specification.

## Adopted Skills

A Skill can be reviewed, adapted, and committed into my-agentic when relying on
its upstream package would be disproportionate or incompatible with the
installation model.

In that case my-agentic takes responsibility for maintaining the adopted
version. Otherwise, Skills remain managed external dependencies.
