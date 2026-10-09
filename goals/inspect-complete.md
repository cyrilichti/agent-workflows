# Inspect Complete

## Outcome

One exact request snapshot is inspected autonomously, with any findings
published. Blocking findings return to `/work`; a passing inspection applies
`agent-inspected` and stops without invoking `/done`.

## Terminal Outcomes

- Corrective: every valid finding for the frozen HEAD is observed as published
  once before blocking findings return to `/work` with their IDs, exact
  content, and source SHA.
- Complete: no blocking finding remains, `agent-inspected` is observed on the
  item after any required publication, and `../templates/inspect-result.md` is
  presented without invoking `/done`.
- Stopped: incomplete context, inconsistent prior publication, publication
  failure, or label failure is reported without claiming inspection
  completion.
