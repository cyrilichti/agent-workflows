# Plan

## Purpose

Create and approve one plan, or return `needs-refinement` for multiple delivery
units.

---

## Required Context

Load `../goals/plan-complete.md` once as this workflow's completion contract.

---

## Steps

### 1. Follow One Context Branch

Follow `./plan-item.md` when the caller supplies complete official item context,
not pasted or inferred metadata.

When the user explicitly identifies an official item by provider ID, native URL,
or title, resolve the configured item provider and run
`../commands/resolve-existing-item.md` with the supplied reference or query and
`fields: labels`. Require the resolved item to contain the exact `agent-shaped`
label, then follow `./plan-item.md` with that complete official item context.

Otherwise, follow `./plan-standalone.md`.
