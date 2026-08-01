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

### Cohorts

| Cohort | Purpose |
| --- | --- |
| Product and content | Define value, scope, items, documentation, and SEO direction. |
| Design and accessibility | Shape user experience, visual systems, and accessible outcomes. |
| Architecture and assurance | Design solutions and independently assess correctness, security, and performance. |
| Application delivery | Implement generic, cross-layer, mobile, and developer-tooling work. |
| Specialized delivery | Implement work where a language or framework materially determines the method. |
| Data and AI | Analyze data, build data and model workflows, and deliver AI capabilities. |
| Quality and diagnosis | Define and implement validation, reproduce failures, and isolate root causes. |
| Operations | Design cloud infrastructure, automate delivery, and improve production reliability. |

### Complete profile inventory

This is the target catalog. Profiles marked as fallbacks are selected only
when no more specific profile matches. Starting Skills are reviewed,
non-exhaustive routes: an agent reevaluates them for the active context and may
combine or replace them. Related specialists intentionally share strong family
Skills instead of depending on weaker keyword matches.

| Profile | Cohort | Primary responsibility | Starting Skills |
| --- | --- | --- | --- |
| `item-writer` | Product and content | Draft or reformulate one provider-neutral item. | `interview-me`, `idea-refine`, `grilling`, `to-spec` |
| `product-manager` | Product and content | Evaluate value, product strategy, investment choices, and roadmap order. | `prioritization-advisor` |
| `product-owner` | Product and content | Define the next deliverable, backlog scope, and acceptance decisions. | `to-spec`, `to-tickets` |
| `technical-writer` | Product and content | Produce structured technical documentation and guidance. | `technical-writing`, `source-driven-development` |
| `seo-specialist` | Product and content | Cover technical, semantic, content, keyword, crawl, indexing, linking, and structured-data SEO. | `seo-geo` |
| `ux-designer` | Design and accessibility | Design journeys, interactions, navigation, and usability. | `customer-journey-map`, `interview-me` |
| `ui-designer` | Design and accessibility | Define visual direction, responsive composition, components, and design systems. | `frontend-design` |
| `accessibility-specialist` | Design and accessibility | Audit WCAG compliance, semantics, keyboard use, assistive technology, and visual accessibility. | `web-design-guidelines` |
| `solution-architect` | Architecture and assurance | Design architecture within one system or across multiple systems and rollout paths. | `planning-and-task-breakdown`, `source-driven-development` |
| `reviewer` | Architecture and assurance | Review changes for defects, regressions, maintainability, and convention drift. | `code-review-and-quality` |
| `security-engineer` | Architecture and assurance | Assess threats, authentication, authorization, data exposure, and hardening. | `security-and-hardening` |
| `performance-engineer` | Architecture and assurance | Measure and diagnose latency, throughput, scalability, and resource use. | `performance-optimization` |
| `backend-developer` | Application delivery | Implement backend work when no framework specialist exists. Fallback. | `source-driven-development`, `test-driven-development`, `api-and-interface-design`, `service-decomposition` |
| `frontend-developer` | Application delivery | Implement frontend work when no framework specialist exists. Fallback. | `source-driven-development`, `test-driven-development`, `tailwind-4-docs`, `web-design-guidelines` |
| `fullstack-developer` | Application delivery | Deliver a genuinely atomic vertical slice spanning frontend and backend. | `source-driven-development`, `test-driven-development` |
| `mobile-developer` | Application delivery | Implement mobile work across platforms and frameworks. Fallback. | `source-driven-development`, `test-driven-development` |
| `developer-experience-engineer` | Application delivery | Improve local tooling, developer CLIs, SDK ergonomics, generators, and repository automation. | `source-driven-development`, `test-driven-development` |
| `laravel-developer` | Specialized delivery | Implement Laravel-specific backend work. | `laravel-best-practices`, `test-driven-development`, `api-and-interface-design`, `service-decomposition` |
| `symfony-developer` | Specialized delivery | Implement Symfony-specific backend work. | `symfony:tdd-with-phpunit`, `source-driven-development`, `api-and-interface-design`, `service-decomposition` |
| `nestjs-developer` | Specialized delivery | Implement NestJS services and applications. | `nestjs-best-practices`, `source-driven-development`, `test-driven-development`, `api-and-interface-design`, `service-decomposition` |
| `python-developer` | Specialized delivery | Implement general Python work when no Python framework specialist exists. Fallback. | `source-driven-development`, `test-driven-development` |
| `fastapi-developer` | Specialized delivery | Implement FastAPI services and applications. | `source-driven-development`, `test-driven-development`, `api-and-interface-design`, `service-decomposition` |
| `react-developer` | Specialized delivery | Implement React-specific frontend work. | `source-driven-development`, `test-driven-development`, `vercel-react-best-practices`, `tailwind-4-docs`, `shadcn` |
| `vue-developer` | Specialized delivery | Implement Vue-specific frontend work at component or application scale. | `vue`, `source-driven-development`, `test-driven-development`, `tailwind-4-docs` |
| `data-analyst` | Data and AI | Explore data, define KPIs, identify trends, and support decisions. | `data-analysis-jupyter` |
| `data-scientist` | Data and AI | Cover advanced analysis, models, experiments, and data pipelines. | `data-analysis-jupyter`, `scikit-learn-best-practices`, `test-driven-development` |
| `database-engineer` | Data and AI | Design schemas, optimize queries, run safe migrations, and preserve integrity. | `supabase-postgres-best-practices`, `source-driven-development` |
| `ml-engineer` | Data and AI | Build training, serving, monitoring, and model-lifecycle systems. | `scikit-learn-best-practices`, `test-driven-development`, `observability-and-instrumentation` |
| `ai-engineer` | Data and AI | Build LLM and agent features, including prompting, retrieval, evaluation, and guardrails. | `evaluate-rag`, `source-driven-development`, `test-driven-development` |
| `qa-engineer` | Quality and diagnosis | Define validation strategy and implement automated or manual test coverage. | `test-driven-development`, `code-review-and-quality` |
| `debugger` | Quality and diagnosis | Reproduce failures, test hypotheses, isolate causes, and return root-cause evidence. | `systematic-debugging` |
| `cloud-engineer` | Operations | Design and implement cloud infrastructure with cost and security constraints. | `source-driven-development`, `security-and-hardening`, `planning-and-task-breakdown` |
| `devops-engineer` | Operations | Build CI/CD, release, container, deployment, and rollback automation. | `ci-cd-and-automation` |
| `sre` | Operations | Improve SLOs, observability, resilience, incident response, and production reliability. | `observability-and-instrumentation`, `systematic-debugging` |

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
