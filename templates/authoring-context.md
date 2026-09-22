# Authoring Context

Write→`item-writer` working context. Other callers may use their own field
lists.

## Format

```text
intention: <initial working context or confirmed intention>
facts_constraints: <when known>
open_questions: <unresolved questions, including blockers explicitly left open>
to_spec: accepted | declined <only after an explicit user decision>
official_title: <update only>
official_body: <update only>
sources: <user-identified code, specs, files, URLs>
current_proposal: <Adjust only>
last_adjustment: <Adjust only>
```

## Rules

- Include only fields that apply; omit the rest.
- Exclude orchestration, destination, status, assignees, links, provider IDs,
  and other provider results. Official title and body are the only provider
  content allowed, and only for update.
- Record `to_spec` only from an explicit user decision.
- Keep a compact working context by updating applicable fields incrementally
  with meaningful answers, sources, and revisions.
- Remove obsolete content and resolved questions.
- Retain an unresolved blocker in `open_questions` until the proposal reflects
  it visibly.
