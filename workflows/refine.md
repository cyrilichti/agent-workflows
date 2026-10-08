# Refine

## Purpose

Decompose one oversized official item into confirmed provider-backed child
items without changing the parent.

---

## Required Context

Load `../goals/refine-complete.md` once as this workflow's completion contract.

A complete refinement context contains:

- the official parent core fields, including acceptance criteria present in
  its content;
- current labels and complete comments;
- linked resources and attachments when the provider supports them.

For either entry mode, preserve supplied fields and known empty results. Run
`../commands/read-item.md` only for missing information, then add only the
missing fields to the parent context. Mark unsupported information explicitly
as unavailable. Stop when supported required information cannot be read.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./refine-item.md` when the caller supplies a resolved provider, the
  complete official parent item, and `needs-refinement` findings;
- otherwise, follow `./refine-standalone.md`.

Fail an explicit but incomplete caller handoff instead of switching it to
standalone mode.
