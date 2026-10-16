# search-items

```text
clickup-cli task search --page 0 --include-closed --subtasks --output json
```

The CLI has no title-query flag. Match task names against the caller's title
phrase locally, ignoring case and surrounding/repeated whitespace. Prefer
exact matches, then phrase matches. Return at most five relevant records with
ID, name, status, URL, and hierarchy, preserving provider order for ties.
Do not limit candidates before matching or paginate unless the user refines
the search. A first-page miss does not establish Workspace-wide absence;
request an exact task URL/ID when the bounded search cannot resolve it.
