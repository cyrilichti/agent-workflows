# create-blocking-relations

For each caller-supplied blocking child ID:

```text
clickup-cli task add-dep <blocked child ID> --depends-on <blocking child ID> --output json
```

The first task waits for the `--depends-on` task. Require successful exit for
each relationship. Use only supplied IDs; do not search, invert the direction,
or create a non-blocking link. Do not update either child or its parent.
