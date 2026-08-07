# Agents

This directory contains the project's **AI agents**.

An agent is a specialized AI worker responsible for a specific role within the
project. Agents encapsulate expertise, responsibilities, and instructions for a
well-defined task.

Depending on the AI platform, agents may be:

* selected explicitly by the user;
* selected automatically by the AI based on the current task;
* delegated as independent sub-agents working in parallel.

---

## Purpose

Agents help the AI:

* specialize its reasoning;
* separate responsibilities;
* reduce prompt complexity;
* delegate complex tasks to specialized workers.

---

## Organization

Each agent is defined in its own Markdown file.

```text
./
├── README.md
├── product-owner.md
├── backend-developer.md
├── reviewer.md
├── devops-engineer.md
└── ...
```

Each file typically contains:

* metadata (name, description, model, tools... depending on the platform);
* the agent instructions;
* skills the agent may use for shared capabilities.

Example:

```markdown
---
name: cloud-engineer
description: Designs and operates cloud infrastructure and services.
model: inherit
readonly: false
---

# Cloud Engineer

Design cloud-ready solutions with cost, security, scalability, and
operational simplicity in mind.

## Responsibilities

- Design cloud architectures.
- Review infrastructure decisions.
- Optimize operational costs.
- Improve reliability and security.

## Constraints

- Follow project conventions.
- Prefer simple and maintainable solutions.
- Explain architectural trade-offs.

## Output

Return concise, actionable recommendations aligned with project conventions.
```

## Responsibilities

An agent should:

* have a single, well-defined responsibility;
* remain focused on its area of expertise;
* consult project knowledge instead of duplicating it;
* produce a clear and structured result.

Agents should not redefine business rules, workflows, or project conventions.

---

## Delegation

When supported by the AI platform, agents may be delegated as independent
workers.

A delegated agent receives a focused mission, performs its work independently,
then returns a structured result to the calling agent.

Before any non-trivial work, follow `../workflows/sub-agent.md`. Selection and
activation are a single mandatory step.

Delegation is particularly useful for:

* code reviews;
* architecture analysis;
* security audits;
* documentation reviews;
* business rule analysis;
* test strategy.

---

## Best Practices

* Prefer many small, specialized agents over one generic agent.
* Keep agent instructions concise.
* Reference project knowledge instead of duplicating it.
* Make the agent's mission immediately understandable from its description.

---

## Matrix

Select the most specific agent that matches the active todo. Broad agents are
fallbacks when no technology or domain specialist exists. A specialist may
reuse the general Skills of its family in addition to its own starting Skills.

### Skills

Each profile declares exact entrypoints for a reviewed, locked starting
collection. Unless a profile explicitly defines routing, its Skills are
complementary capabilities rather than mutually exclusive routes. Use them when
relevant; the collection is a non-exhaustive starting point, not a fixed limit.

`item-writer`, `product-owner`, `ux-designer`, `qa-engineer`, and `sre` define
contextual routing because their Skills represent distinct working modes. The
active profile remains authoritative over a Skill for scope, permissions, side
effects, and output. Skill activation is governed globally by
`../rules/skill-activation.md`.

### Routing

Use `../data/agent-routing.md` when `../workflows/sub-agent.md` needs to select
a new profile. Do not scan profile frontmatter for routing.

### Approved Skill sources

The package reference identifies the exact reviewed source. Existing locked
Skills keep their current source in `skills-lock.json`.

| Skill | Package reference |
| --- | --- |
| `prioritization-advisor` | `deanpeters/product-manager-skills@prioritization-advisor` |
| `customer-journey-map` | `phuryn/pm-skills@customer-journey-map` |
| `technical-writing` | `proffesor-for-testing/agentic-qe@technical-writing` |
| `seo-geo` | `resciencelab/opc-skills@seo-geo` |
| `frontend-design` | `anthropics/skills@frontend-design` |
| `web-design-guidelines` | `vercel-labs/agent-skills@web-design-guidelines` |
| `code-review-and-quality` | `addyosmani/agent-skills@code-review-and-quality` |
| `security-and-hardening` | `addyosmani/agent-skills@security-and-hardening` |
| `performance-optimization` | `addyosmani/agent-skills@performance-optimization` |
| `test-driven-development` | `addyosmani/agent-skills@test-driven-development` |
| `api-and-interface-design` | `addyosmani/agent-skills@api-and-interface-design` |
| `service-decomposition` | `proyecto26/system-design-skills@service-decomposition` |
| `laravel-best-practices` | `laravel/boost@laravel-best-practices` |
| `symfony:tdd-with-phpunit` | `makfly/superpowers-symfony@symfony:tdd-with-phpunit` |
| `nestjs-best-practices` | `ejirocodes/agent-skills@nestjs-best-practices` |
| `vercel-react-best-practices` | `vercel-labs/agent-skills@react-best-practices` |
| `tailwind-4-docs` | `lombiq/tailwind-agent-skills@tailwind-4-docs` |
| `shadcn` | `shadcn/ui@shadcn` |
| `vue` | `antfu/skills@vue` |
| `data-analysis-jupyter` | `mindrally/skills@data-analysis-jupyter` |
| `scikit-learn-best-practices` | `mindrally/skills@scikit-learn-best-practices` |
| `supabase-postgres-best-practices` | `supabase/agent-skills@supabase-postgres-best-practices` |
| `evaluate-rag` | `hamelsmu/evals-skills@evaluate-rag` |
| `systematic-debugging` | `obra/superpowers@systematic-debugging` |
| `ci-cd-and-automation` | `addyosmani/agent-skills@ci-cd-and-automation` |
| `observability-and-instrumentation` | `addyosmani/agent-skills@observability-and-instrumentation` |

---

## References

* Cursor – Sub Agents: [cursor-subagents]
* OpenAI Codex – Subagents: [openai-codex-subagents]
* AGENTS.md: [https://agents.md/](https://agents.md/)
* .agents Protocol: [dotagents-protocol]

[cursor-subagents]: https://cursor.com/docs/subagents
[openai-codex-subagents]:
  https://developers.openai.com/codex/concepts/subagents
[dotagents-protocol]:
  https://github.com/aj47/dotagentsprotocol-website
