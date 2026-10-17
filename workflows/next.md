# Next

## Purpose

Run the configured provider's next-item selection and return its formatted
result. This is a standalone entry point.

---

## Steps

### Run the Selection Program

From the directory containing this workflow file, run:

```sh
node ../commands/next.ts
```

The program reads `agent-workflows.yaml` and returns one JSON object. A result
is valid only after this program has completed successfully in the current run.
When it returns an item or `{"status":"no eligible item"}`, return that JSON
object unchanged and stop. On a nonzero exit, stop and report the error.
