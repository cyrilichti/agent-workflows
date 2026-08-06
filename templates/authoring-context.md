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
- Exclude orchestration, destination, status, assignees, links, provider IDs,
  and other provider results. Official title and body are the only provider
  content allowed, and only for update.
- Exclude obsolete history.
