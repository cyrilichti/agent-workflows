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

When the caller supplies official item context, follow `./plan-item.md` with
that context and its supplied resolved provider. Otherwise, follow
`./plan-standalone.md`.
