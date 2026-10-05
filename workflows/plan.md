# Plan

## Purpose

Create and approve one plan, or return `needs-refinement` for multiple delivery
units.

---

## Required Context

Load `../goals/plan-complete.md` once as this workflow's completion contract.

---

## Steps

### 1. Resolve Entry Mode

Use `workflow` only when the caller explicitly supplies that entry mode.
Otherwise, use `standalone`.

### 2. Resolve Explicit Item Context

Preserve official item context and its resolved provider when supplied by the
caller.

Otherwise, when the request explicitly identifies an existing official item by
provider ID, native URL, or title, run `../commands/resolve-item-provider.md`
with the following input. Treat a quoted title supplied as the object of the
plan request as an explicit item title query.

```text
context: item
```

Then run `../commands/resolve-existing-item.md` with the supplied value as
`reference` or `query` and:

```text
provider: resolved item provider
fields: labels
```

Keep the returned item and provider as official context. Do not search for an
item when the request only describes work without identifying one.

### 3. Follow One Context Branch

With official item context, follow `./plan-item.md` with that context, its
resolved provider, and the resolved entry mode. Otherwise, follow
`./plan-standalone.md`.

### 4. Finish

In `workflow` mode, return the branch result to the caller. In `standalone`
mode, report the branch result and stop.
