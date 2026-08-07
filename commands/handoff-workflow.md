# Handoff Workflow

Start one workflow in a fresh context without continuing it in the caller.

## Input

- `source`: calling workflow path.
- `target`: target workflow path.
- `mode`: target entry mode.
- `payload`: fields required by the target workflow.

## Steps

1. Validate the inputs. Reject `workflow` or `handoff` in `payload`.
2. Use the host handoff or new-task mechanism to invoke `target` with only:

   ```text
   workflow: target
   handoff:
     source: source
     mode: mode
     context: fresh
   <payload fields>
   ```

3. Return `dispatched` only after observing creation of the new context. Include
   its ID when available.
4. If no mechanism exists, present the exact context and return `presented`.
   If dispatch fails, return `failed` with the observed reason.

## Result

Return:

```text
status: dispatched | presented | failed
target_context_id: observed ID or Unavailable
reason: failure reason or Unavailable
```

Never execute the target in the source context or pass undeclared context.
