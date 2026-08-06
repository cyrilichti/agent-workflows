# /write visible-output baseline

Captured before ICY-21 implementation changes on branch
`feature/simplify-write-visible-outputs` (HEAD at initialization).

Method: structural inventory of user-facing surfaces required by
`workflows/write.md`, `write-create.md`, `write-update.md`,
`write-confirm.md`, and `goals/write-complete.md`. Counts are mandated
agent turns that ask, propose, block, or report. Variable `item-writer`
dialogue is listed separately and excluded from fixed totals.

Length proxy: sum of authored question/label characters in the fixed
select-option and free-form prompts for that path (ASCII-ish estimate of
template text the agent must surface). Does not include proposal body
length (content-dependent).

## Shared prefix (every path)

| # | Surface | Kind |
| --- | --- | --- |
| 1 | Mode: create vs reformulate | select-option |
| 2 | Need description | free-form ask |

Fixed surfaces: **2**  
Prompt-length proxy: **~95** chars (`What do you want to write?` + option labels + need ask)

## Path inventories

### create (happy path, unassigned)

| # | Surface | Kind |
| --- | --- | --- |
| 1–2 | Shared prefix | — |
| 3 | Destination name | free-form ask |
| 4 | Destination pick (only if several matches) | select-option |
| 5 | Item preview | item-preview |
| 6 | Save vs Adjust | select-option |
| 7 | Assignment: leave unassigned vs assign | select-option |
| 8 | Saved result report | free-form (write-complete; no template) |

Fixed surfaces (single-match destination): **7**  
Optional extra: destination multi-match (+1)  
Prompt-length proxy (fixed): **~280**  
Terminal report: unstructured; typically title/link/assignment prose (est. **80–200** chars)

### reformulate (happy path, keep assignment)

| # | Surface | Kind |
| --- | --- | --- |
| 1–2 | Shared prefix | — |
| 3 | Item title/ID query | free-form ask |
| 4 | Resolved item identity (title, status, link) | report |
| 5 | Item preview | item-preview |
| 6 | Save vs Adjust | select-option |
| 7 | Assignment: keep vs reassign | select-option |
| 8 | Saved result report | free-form (write-complete) |

Fixed surfaces: **8**  
Prompt-length proxy (fixed): **~320**  
Terminal report: same unstructured est. **80–200** chars

### adjust (create path + one Adjust cycle)

Same as create, plus one free-form adjustment ask, one revised preview, and
one re-confirm select-option before Save.

Fixed surfaces: **10** (create 7 + 3)  
Prompt-length proxy: **~360**

### unassigned

Same as create happy path (assignment choice = leave unassigned).  
Fixed surfaces: **7**

### successful assignment (create)

Create path through Save, then:

| Extra | Surface | Kind |
| --- | --- | --- |
| +1 | Assignee query (`me` / name / email) | free-form ask |
| +1 | Assignee pick (only if several) | select-option |
| end | Saved + assigned result report | free-form |

Fixed surfaces (single-match assignee): **8**  
Optional extra: assignee multi-match (+1)

### partial failure (save ok, assignment fail)

Same surfaces as successful assignment through assignee resolution; terminal
report must describe partial success (item saved, assignment failed) per
write-complete stop conditions. Still **unstructured** — no dedicated
remaining-action section template.

Fixed surfaces: **8**  
Terminal report: unstructured partial-success prose (est. **120–250** chars)

## Variable surfaces (excluded from fixed totals)

- `item-writer` / writing-Skill Q&A turns (0..n)
- Skill-activation one-liners when a writing Skill is routed
- Multi-match destination or assignee select-option turns

## Summary table

| Path | Fixed surfaces | Prompt-length proxy | Terminal template |
| --- | ---: | ---: | --- |
| create / unassigned | 7 | ~280 | none (free-form) |
| reformulate / keep | 8 | ~320 | none (free-form) |
| adjust (+1 cycle) | 10 | ~360 | none (free-form) |
| successful assignment | 8 | ~300 | none (free-form) |
| partial failure | 8 | ~300 | none (free-form) |

## Gaps this change targets

- No `write-result.md`; terminal reporting is free-form.
- No explicit negative constraints against intention-confirmed /
  assignee-resolution narration (improvised chatter possible).
- `caveman` not in `skills-lock.json`.
