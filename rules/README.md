# Rules

Permanent project constraints and engineering conventions.

Unlike workflows, rules describe **what must be respected**, not how to execute a process.

---

## What does NOT belong here

* business rules → `domain/`
* procedures → `workflows/`
* capabilities → `skills/`
* history → `memory/`
* output formats → `templates/`

---

## Organization

One topic per file. Concise bullet lists. Frontmatter for scope when projected to an IDE.

```text
rules/
├── README.md
├── api.md
└── frontend.md
```

IDE projections: `.cursor/rules/*.mdc`, `.claude/rules/*.md`

---

## Rule Loading

`.agents/rules/` is a library of contextual constraints. Rule files are **not**
loaded by default and should not be treated as global background text.

Load a rule only when the current task explicitly needs its constraint.

Accepted loading paths:

* direct reference from an agent, skill, workflow, or IDE rule projection;
* matching file scope such as Cursor `globs` or Claude `paths`;
* explicit developer request.

Avoid `alwaysApply` by default. It is only for rare invariants that must apply to
every task, including non-development tasks.

Reference specific rule files. Do not load the whole `rules/` directory unless
the task is to audit the rules themselves.

---

## Examples

### Claude (`.claude/rules/`)

```markdown
---
paths:
  - "src/api/**/*.ts"
---

- All API endpoints must include input validation
- Use the standard error response format
```

### Cursor (`.cursor/rules/`)

```markdown
---
globs: src/components/**/*.tsx
alwaysApply: false
---

- Use named exports, not default exports
- Keep components under 200 lines
```

---

## Best Practices

* Short, actionable bullets.
* Scope with `paths`, `globs`, or explicit references.
* Reserve `alwaysApply` for critical invariants only.

---

## References

* [Cursor – Rules](https://cursor.com/docs/rules)
* [Claude Code – Memory](https://code.claude.com/docs/en/memory)
* [dotcursorrules](https://dotcursorrules.com/rules) — community templates
* [cursorrules.org](https://cursorrules.org/) — community templates
