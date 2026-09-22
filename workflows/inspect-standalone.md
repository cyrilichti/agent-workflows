# Inspect Standalone Branch

## Steps

### 1. Initialize the Delivery Context

Follow `./delivery-context-standalone.md` and keep its plan, item, and delivery
context.

### 2. Resolve the Request

Resolve the configured version provider and repository from the current Git
push remote. Run `../commands/resolve-request.md` with the official item
backlinks, any supplied request ID, and `require_non_draft: true`.

Add the current branch and exact request to the delivery context, then follow
`./inspect-execute.md`.
