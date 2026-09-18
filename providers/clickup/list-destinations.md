# list-destinations

Require the caller `query` as a List URL, ID, name, or path.

For a native ClickUp URL, extract candidate IDs from the URL and resolve them
with `clickup_get_list` using `list_id`. Mark the result `native_url` only when
the resolved List ID matches an ID extracted from the supplied URL.

Resolve a plain ID with:

```text
tool: clickup_get_list
arguments:
  list_id: caller query
```

Verify the returned ID before marking it `exact_id`.

For a name or path, read the paginated workspace hierarchy with:

```text
tool: clickup_get_workspace_hierarchy
arguments:
  max_depth: "2"
  cursor: next cursor when present
```

Compare the query with every List name and readable hierarchy path using the
command's normalization. Mark exact normalized matches accordingly. Mark an
approximate match as strong only after every page has been compared and no
similarly close List exists.

Only Lists are valid creation destinations. Return each candidate with:

```text
label: readable Space / Folder / List path
value: internal List ID
match: native_url | exact_id | normalized_exact_name |
  strong_unique_approximate | possible
```
