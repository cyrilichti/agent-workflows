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

Agents should focus on **how to perform a role**, while project knowledge
remains in the other `.agents` directories.

---

## Organization

Each agent is defined in its own Markdown file.

```text
./
├── README.md
├── business-analyst.md
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
