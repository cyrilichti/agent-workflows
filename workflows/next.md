# Next

## Purpose

Run the configured provider's next-item selection and return its formatted
result. This is a standalone entry point.

---

## Steps

### 1. Run the Selection Program

From the directory containing this workflow file, run:

```sh
node ../commands/next.ts
```

The program reads `agent-workflows.yaml` and returns one JSON object. A result
is valid only after this program has completed successfully in the current run.
When it returns an item or `{"status":"no eligible item"}`, return that JSON
object unchanged and stop. On a nonzero exit, stop and report the error.

### 2. Resolve Exceptional Statuses

When the program returns `{"status":"classify-statuses",...}`, interpret each
reported status name as `waiting`, `review`, or `other` using its ordinary
meaning. Treat ambiguous names as `other`. Then run the program once more with
the returned snapshot path and comma-separated categories in the same order as
the reported names:

```sh
node ../commands/next.ts --resume "<snapshot>" "<categories>"
```

Return its final JSON object unchanged. Do not read the snapshot or rerun the
provider query. A nonzero exit is an error.
