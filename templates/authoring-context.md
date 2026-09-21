# Authoring Context

Write→`item-writer` working context. Other callers may use their own field
lists.

## Format

```text
intention: <initial working context or confirmed intention>
facts_constraints: <when known>
open_questions: <unresolved questions, including blockers explicitly left open>
direct_drafting: true <only when explicitly requested or purely mechanical>
accepted_skill: to-spec <only after explicit request or accepted suggestion>
understanding_summary: <latest concise summary awaiting or carrying confirmation>
understanding_confirmed: true <only after explicit confirmation>
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
- Treat `intention` as unconfirmed working context until
  `understanding_confirmed: true`; never infer confirmation from completeness.
- Record `direct_drafting`, `accepted_skill`, and `understanding_confirmed` only
  from explicit user input or the workflow's purely mechanical determination.
- Keep a compact working context by updating applicable fields incrementally
  with meaningful answers, sources, and revisions.
- Remove obsolete content and resolved questions.
- Retain an unresolved blocker in `open_questions` until the proposal reflects
  it visibly.
