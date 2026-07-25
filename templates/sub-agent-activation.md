# Sub-agent Activation

Use when a sub-agent profile has been activated and the activation must be
reported to the user.

## Format (Markdown)

```markdown
## <Readable agent name>

<short reason related to the task>
```

One line under the title. No metadata fields (slug, mode, consulted files).

## Human-Friendly Names

Use readable names in user-facing output.

Examples:

* `ai-engineer` → `AI Engineer`
* `backend-developer` → `Backend Developer`

Keep technical identifiers internal.

## Optional Emoji

A subtle emoji in the title when it improves readability.

## Rules

* Activated profile as title (`##`), reason as a single line below.
* Keep the reason short and specific to the task.
* Mention alternatives only when meaningful — as a second short line, not a
  labeled field.
* Announce activation whenever a sub-agent profile is loaded.
* No internal reasoning, exploration logs, or tool-by-tool narration.
