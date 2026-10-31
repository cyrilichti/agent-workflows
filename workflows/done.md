# Done

Read any rules below that are not already active:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Invoking `/done` authorizes completion without another confirmation. Supply an
item ID or native URL:

```sh
node ../commands/done.ts <<'JSON'
{"reference":"<item ID or URL>"}
JSON
```

For a title or search phrase, use `{"query":"<phrase>"}` instead. If no item
is identifiable from the request, ask for one before running the command.

Report the command's observed result. A complete result means the request is
merged and the item is done. A stopped result includes its reason; a partial
result includes the remaining item action. Keep the exact identities visible:

```markdown
## Done result

**Request <repository#ID or unavailable>:** <observed state>
**Item <ID or unavailable>:** <observed status>
**Reason:** <command reason, when present>
**Remaining:** <command remaining action, when present>
```
