# Authoring Context

Write→`item-writer` packet. Other callers may use their own field lists.

## Format

```text
intention: <confirmed intention>
facts_constraints: <when known>
open_questions: <when known>
official_title: <update only>
official_body: <update only>
sources: <user-identified code, specs, files, URLs>
current_proposal: <Adjust only>
last_adjustment: <Adjust only>
```

## Rules

- Include only fields that apply; omit the rest.
- Exclude orchestration, provider IDs/results (beyond official title/body), and obsolete history.
