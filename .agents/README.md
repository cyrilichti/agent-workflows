# .agents

This repository defines a shared agentic engineering frame for AI-assisted work.

Its purpose is to make AI agents work through an explicit, repeatable process: route the request, select the right workflow, activate the right specialist, load only the useful context, then produce a focused result.

## Why This Exists

AI assistants are most useful when they are not treated as a single generic chat box.

This context frame helps teams:

- reduce vague, one-size-fits-all answers;
- force a clear workflow before non-trivial work starts;
- specialize responses through technical sub-agents;
- load rules, skills, templates, and tools only when they are relevant;
- keep the agent focused on the current objective instead of flooding it with background text.

## Core Idea

`AGENTS.md` is the entry point.

`.agents/` contains the reusable agentic operating model:

- workflows define how work is routed and executed;
- sub-agents define specialized execution postures;
- rules constrain specific situations;
- skills package reusable capabilities;
- templates standardize recurring outputs;
- hooks and MCP configuration connect the agent to external systems.

The goal is to provide a disciplined execution frame, not a giant prompt.

## Project Knowledge

Business and product knowledge should usually remain in each project, for
example in `docs/`.

Sub-agents may inspect those project docs when they need domain context, but the shared `.agents/` frame should stay mostly technical and cross-project.

This keeps the shared agentic system reusable while allowing each project to carry its own domain language, architecture notes, runbooks, and constraints.

## Design Principle

Load less, but load better.

The system should prefer small, explicit, routed context over broad global
instructions. A rule or skill is valuable when it is selected for the current work, not when it is always present as background noise.
