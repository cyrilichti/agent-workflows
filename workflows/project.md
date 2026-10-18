# Project

## Purpose

Resolve a `list` to one absolute local project directory, using the item to
choose when several repositories match. This is a standalone entry point.

---

## Required Context

Load `../goals/project-complete.md` as this workflow's completion contract.
Follow `../rules/user-facing-output.md`.

---

## Steps

### 1. Require Input

Require a non-blank `list` and an exact item ID. Stop with an input error if
either is missing; do not infer them.

### 2. Find Repositories

Get the configured project paths from the active execution environment. If the
configuration is unavailable or unreadable, use an empty array. From the
directory containing this workflow file, run
`node ../commands/resolve-local-project-directory.ts` once with the exact
`list` and the JSON array of configured paths as separate process arguments.
The command prefers a repository whose name does not contain `api` or `back`
when several paths remain, then chooses the lexicographically smallest absolute
path. Return its path or unresolved status JSON unchanged. If it fails,
report the error.
