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
not pasted or inferred metadata. Otherwise, follow `./plan-standalone.md`.
