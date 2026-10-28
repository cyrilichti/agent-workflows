# Ready Item Branch

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

On failure, report `stage`, `reason`, and observed identities; stop.

### 2. Continue to Inspect

On `status: promoted`, follow `./inspect.md` in caller mode with the returned
complete `delivery_context`.
