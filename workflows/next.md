# Next

## Purpose

Run the configured provider's next-item selection and return its formatted
result. This is a standalone entry point.

---

## Required Context

Load `../goals/next-complete.md` as this workflow's completion contract.
Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Resolve Item Provider

Run `../commands/resolve-item-provider.md`.

### 2. Select the Next Item

Run `../commands/select-next-item.md` with:

```text
provider: resolved item provider
```

### 3. Return the Result

Format the returned result with `../templates/next-result.md`.
