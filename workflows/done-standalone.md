# Done Standalone

## Steps

### 1. Complete One Linked Request and Item

Run from this file's directory. For an item ID or native URL:

```sh
node ../commands/done.ts <<'JSON'
{"reference":"<item ID or URL>"}
JSON
```

For a title or search phrase:

```sh
node ../commands/done.ts <<'JSON'
{"query":"<title or search phrase>"}
JSON
```

Require one official item and one linked request in the current push repository.
The command verifies `agent-inspected`, a unique done status, squash support,
and an open, non-draft, mergeable request or an already merged request before
mutation. An open request is reread immediately before squash merge; identity,
branches, state, and head SHA must still match. The command observes the merged
state before moving the item to done. It does not retry a merge or select a
substitute request or item.

### 2. Report

Use the command's observed result in this exact format:

```markdown
## Done result

**Request <provider/repository#ID>:** <observed request result>
**Item <ID>:** <observed item result>

**Remaining:** <exact item action; only when the request is merged and the item remains>
```

For an early failure without resolved identities, report the command reason
and any known identity. Never claim an unobserved mutation. After an observed
merge, the item transition is the only remaining action.
