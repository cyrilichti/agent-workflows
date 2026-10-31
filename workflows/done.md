# Done

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

---

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

Invoking `/done` authorizes the eligible completion without another
confirmation.

---

## Steps

### 1. Complete the Request and Item

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/done.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/done.ts --query "<item>"
```

If the item is missing, ask for it before running the command.

### 2. Report

Use the final result contract below. On failure, put the returned `stage` and
`reason` after the block.

## Final Result Contract

Use this block for every terminal `/done` result:

```markdown
## Done result

**Request <provider/repository#ID>:** <observed request result>
**Item <ID>:** <observed item result>

**Remaining:** <exact request or item action; omit when none or no actionable next step is known>
```

- Report observed states rather than intended states.
- Lead with the observed request and item results without another subheading.
- Keep both identities visible; use `unavailable` if one could not be resolved.
- Include `Remaining` only when the command supplies one exact actionable
  mutation.
