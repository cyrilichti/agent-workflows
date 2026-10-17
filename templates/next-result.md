# Next Result

Use when `/next` finishes the provider selection query.

## Found Format

Return exactly one JSON object, without a Markdown fence or surrounding text:

```json
{"name":"<current item title>","id":"<provider item ID>","url":"<item URL>","list":"<project or list name>"}
```

## Empty Format

When the selection command returns no match, including from an empty page or a
nonempty page with no eligible item, return exactly:

```json
{"status":"no eligible item"}
```

## Rules

- Copy only the returned item's title, ID, URL, and destination name.
- Do not include provider metadata, candidate counts, or explanation in the
  found result.
