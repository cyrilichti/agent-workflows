# list-destinations

For a native List URL or ID, extract its candidate ID and resolve it with:

```text
clickup-cli list get <List ID> --output json
```

Verify the single returned ID before marking `native_url` or `exact_id`.
For a name/path, enumerate the configured Workspace:

```text
clickup-cli space list --output json
clickup-cli folder list --space <Space ID> --output json
clickup-cli folder get <Folder ID> --output json
clickup-cli list list --space <Space ID> --output json
```

Use Folder details for their Lists and parent chains; `folder list` omits them.
Include folderless Lists, deduplicate by ID, and compare every List name/path
with the caller's normalization. Return creatable candidates as `label`
(readable hierarchy), `value` (List ID), and `match`: `native_url`, `exact_id`,
`normalized_exact_name`, `strong_unique_approximate`, or `possible`.
Require complete enumeration before declaring a unique approximate match.
