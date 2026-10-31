# Inspect Complete

## Outcome

One exact request snapshot is inspected autonomously, with any findings
published. Blocking findings return to `/work`; a passing inspection applies
`agent-inspected`, transitions the item to review, and stops without invoking
`/done`.

## Terminal Outcomes

- Corrective: every valid finding for the frozen HEAD is observed as published
  once before blocking findings return to `/work` with their IDs, exact
  content, and source SHA.
- Complete: no blocking finding remains, `agent-inspected` is observed on the
  item after any required publication, the review transition succeeds, the
  exact request URL and inspected head SHA are recorded on the item, and
  the final result defined in `../workflows/inspect-execute.md` is presented
  without invoking `/done`.
- Stopped: incomplete context, inconsistent prior publication, publication
  failure, label failure, review transition failure, or missing inspection record
  is reported without claiming inspection completion.
