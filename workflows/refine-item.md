# Refine Item

## Input

| Input | Requirement |
| --- | --- |
| `provider` | Resolved item provider |
| `parent_item` | Official parent ID, core fields, current labels, complete comments, and supported linked resources and attachments |
| `needs_refinement_findings` | Exact `needs-refinement` findings from the caller |

The parent content includes its acceptance criteria when present.

## Steps

Follow `./refine-confirm.md` with the supplied `provider`, `parent_item`, and
`needs_refinement_findings`. Preserve the official context and findings without
resolving or assessing them again.
