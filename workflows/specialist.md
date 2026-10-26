# Specialist

## Input

| Input | Requirement |
| --- | --- |
| `task_context` | Existing activity context; do not reshape it. |
| `profile` | Optional explicit profile named by the caller. |

## Routing

Keep the active profile when it fits. Otherwise, use the caller's `profile` or
select the most specific match below. If none fits, return without activation;
the caller continues the task. Ask only when the choice remains ambiguous.

| Task | Profile |
| --- | --- |
| Draft or reformulate one item | `item-writer` |
| Evaluate value, strategy, investment, or roadmap order | `product-manager` |
| Define deliverable scope or acceptance decisions | `product-owner` |
| Write technical documentation or guidance | `technical-writer` |
| Cover technical or content SEO | `seo-specialist` |
| Design journeys, interactions, navigation, or usability | `ux-designer` |
| Define visual direction, components, or design systems | `ui-designer` |
| Audit accessibility | `accessibility-specialist` |
| Design system architecture or rollout paths | `solution-architect` |
| Review changes for defects or regressions | `reviewer` |
| Assess security threats or hardening | `security-engineer` |
| Diagnose performance or resource use | `performance-engineer` |
| Implement generic backend work | `backend-developer` |
| Implement generic frontend work | `frontend-developer` |
| Deliver a frontend-backend vertical slice | `fullstack-developer` |
| Implement mobile work | `mobile-developer` |
| Improve CLIs, SDKs, generators, or local tooling | `developer-experience-engineer` |
| Implement Laravel backend work | `laravel-developer` |
| Implement Symfony backend work | `symfony-developer` |
| Implement NestJS services or applications | `nestjs-developer` |
| Implement general Python work | `python-developer` |
| Implement FastAPI services or applications | `fastapi-developer` |
| Implement React frontend work | `react-developer` |
| Implement Vue frontend work | `vue-developer` |
| Explore data, KPIs, or trends | `data-analyst` |
| Build analyses, models, experiments, or data pipelines | `data-scientist` |
| Design database schemas, queries, or migrations | `database-engineer` |
| Build ML training, serving, or monitoring | `ml-engineer` |
| Build LLM or agent features and evaluations | `ai-engineer` |
| Define validation strategy or test coverage | `qa-engineer` |
| Reproduce failures and isolate root causes | `debugger` |
| Design or implement cloud infrastructure | `cloud-engineer` |
| Build CI/CD, release, container, or deployment automation | `devops-engineer` |
| Improve SLOs, observability, resilience, or incident response | `sre` |

## Activation

For a new selection, read only `../agents/<profile>.md` completely and apply it
in the current conversation. Do not scan other profiles. Announce the activation
once, then return to the caller:

```markdown
> **<Readable profile name>** — <brief reason tied to the task>
```
