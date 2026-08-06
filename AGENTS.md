# AGENTS.md

This project uses `.agents/` as its structured AI context directory.

## Global Rules

Follow `.agents/rules/default-language.md`.

Follow `.agents/rules/git-authorization.md`.

Follow `.agents/rules/skill-activation.md`.

## Session Bootstrap

At the beginning of a new conversation or a new unrelated task, follow
`.agents/workflows/play-book.md`. Do not re-run this for every prompt in the
same task.

## Guidelines

- Load only the context required by the active workflow.
