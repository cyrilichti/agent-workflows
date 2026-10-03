# Next Result

Use when `/next` finishes a complete provider search.

## Found Format

Return exactly one JSON object, without a Markdown fence or surrounding text:

```json
{"name":"<current item title>","id":"<provider item ID>","url":"<item URL>"}
```

## Empty Format

When no eligible item remains after verification, return exactly:

```json
{"status":"no eligible item"}
```

## Rules

- Copy only the current title, ID, and URL from the individually verified item.
- Do not include provider metadata, candidate counts, or explanation in the
  found result.
- A provider failure or incomplete search is an error, never an empty result.
