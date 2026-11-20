# Ready Execute

## Input

| Input | Requirement |
| --- | --- |
| `delivery-context` | Required |

---

## Steps

### 1. Publish and Promote

Run from this file's directory with the complete `delivery-context` as JSON:

```sh
node ../commands/update-request.ts <<'JSON'
<delivery-context JSON>
JSON
```

The command skips a push when the request already has the local head and
skips request updates that have already taken effect.

If Git rejects the push, inspect the local branch and the published request.
When delivery evidence confirms that the intended work is already on the
request, retry with `published_head_sha` set to its observed SHA as an
additional top-level command input. For example, use the request activity
showing the successful delivery push and a subsequent merge from the target
branch. A rejected push alone does not establish that the work was published.
If delivery commits are still pending, resolve the cause and retry the normal
push path.

### 2. Continue to Inspect

On `status: promoted`, follow `./inspect.md` in caller mode with the returned
complete `delivery_context`.
