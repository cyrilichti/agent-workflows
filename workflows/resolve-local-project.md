# Resolve Local Project

## Purpose

Resolve the `list` value from `/next` to one absolute local project directory.
This is a standalone entry point for Kestra.

---

## Required Context

Load `../goals/resolve-local-project-complete.md` as this workflow's
completion contract. Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Require Input

Require one `list` value from the caller. Do not infer it from an item title,
URL, or ID.

### 2. Resolve Directory

Run `../commands/resolve-local-project-directory.md` with:

```text
list: caller list
```

### 3. Return Result

Format the command result with `../templates/resolve-local-project-result.md`.
