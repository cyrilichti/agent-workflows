# Next

## Purpose

Select the oldest open `agent-shaped` item from the configured provider and
return only its identity. This is a standalone, read-only entry point.

---

## Required Context

Load `../goals/next-complete.md` as this workflow's completion contract.
Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Resolve Item Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

### 2. Select the Next Item

Run `../commands/select-next-item.md` with:

```text
provider: resolved item provider
```

No item reference, title, project, team, list, or assignee is required from
the caller.

### 3. Return the Result

Format the returned result with `../templates/next-result.md`. On a provider
failure, report the error and stop without returning the empty outcome.

Do not call `/pick`, `/plan`, or `/work`, create a plan, or mutate an item or
repository.
