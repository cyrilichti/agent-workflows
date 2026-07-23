# Memory

This directory contains the **long-term memory** of the project.

Unlike an AI agent's context window, which is transient and limited, the
knowledge stored here is persistent, versioned and shared across sessions,
models and contributors.

The purpose of this directory is to preserve important knowledge that should not
be rediscovered or re-explained in future work.

---

## Purpose

Use this directory to capture knowledge such as:

* important technical decisions;
* lessons learned;
* recurring pitfalls;
* known limitations;
* validated assumptions;
* project-specific insights.

Memory should evolve throughout the lifetime of the project.

---

## What does NOT belong here

Do not store:

* business documentation (use `domain/`);
* engineering conventions (use `rules/`);
* procedures (use `workflows/`);
* reusable capabilities (use `skills/`);
* temporary meeting notes.

Only retain information that future contributors or AI agents should continue to
know.

---

## Organization

Knowledge should be organized into small, focused Markdown documents.

```text
memory/
├── README.md
├── architecture.md
├── authentication.md
├── deployment.md
└── ...
```

Prefer topic-oriented documents over chronological notes.

---

## What should be memorized?

Ask yourself:

> **"Would we want every future AI agent and every future contributor to
> immediately know this?"**

If the answer is **yes**, it probably belongs here.

Examples include:

* why a particular solution was chosen;
* why an alternative was rejected;
* constraints discovered during development;
* knowledge acquired from production incidents;
* conclusions from technical investigations.

---

## Best Practices

* Store knowledge, not conversations.
* Prefer validated conclusions over raw notes.
* Keep documents focused on a single topic.
* Update memory as the project's understanding evolves.
* Remove obsolete knowledge when it no longer reflects reality.

---

## References

The concept of persistent project memory is inspired by current research on
long-term memory for AI agents.

* Mem0
  [https://mem0.ai/](https://mem0.ai/)

* Mem0 Paper
  [https://arxiv.org/abs/2504.19413](https://arxiv.org/abs/2504.19413)

* Infini Memory
  [https://arxiv.org/abs/2606.10677](https://arxiv.org/abs/2606.10677)

* Is Agent Memory a Database?
  [https://arxiv.org/abs/2605.26252](https://arxiv.org/abs/2605.26252)
