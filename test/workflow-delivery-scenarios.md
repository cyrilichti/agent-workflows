# Delivery workflow validation

These scenarios exercise instruction-driven behavior. Run the selection cases
against `../commands/select-next-item.md` and its provider adapters using mocked
first-page responses, without querying or mutating real items. Assess the
expected outputs directly; do not add a second selection implementation.

## Provider fields

- Linear's `list_issues` call must request `labels` and `updatedAt` as well as
  the existing identity, project, status, and native status type fields.
- ClickUp's `clickup_filter_tasks` response contract exposes `tags[].name`
  and `date_updated` (Unix milliseconds as a string). Both are optional in the
  runtime schema, so test omitted and null fields as well as populated values.
- Verify the active MCP schemas when running these scenarios. Capture an
  available live selection response separately; an empty response cannot
  establish populated field availability.

## Eligibility

Give each row its own page with a valid destination and timestamp. Unless
specified otherwise, labels or tags contain exactly `agent-planned`.
The expected output is the sole item's four-field JSON identity when eligible,
or `{"status":"no eligible item"}` when skipped.

| Provider | Status | Labels or tags | Expected |
| --- | --- | --- | --- |
| Linear | `backlog`, name `Backlog` | planned | Eligible |
| Linear | `unstarted`, name `Todo` | planned | Eligible |
| Linear | `backlog`, name `Custom` | planned, inspected | Eligible |
| Linear | `started`, name `In Review` | planned | Eligible |
| Linear | `started`, name ` review ` | planned | Eligible |
| Linear | `started`, each of `Code Review`, `Awaiting Review`, `Under Review` | planned | Eligible; transition also classifies as review |
| Linear | `started`, each of `Code Review`, `Awaiting Review`, `Under Review` | planned, inspected | Skip |
| Linear | `started`, each of `Review Complete`, `Review Blocked` | planned | Skip; whole meaning does not establish awaiting or undergoing review |
| Linear | `started`, name `In Review` | planned, inspected | Skip |
| Linear | `started`, name `In Progress` | planned | Skip |
| Linear | `started`, name `Open` | planned | Skip |
| Linear | each of `triage`, `completed`, `canceled`, `duplicate` | planned | Skip |
| Linear | missing or unknown native type, name `In Review` | planned | Skip |
| ClickUp | each of `Open`, `To Do`, `Todo`, `Backlog`, `Not Started`, `Awaiting Start` | planned | Eligible |
| ClickUp | ` to do ` | planned | Eligible |
| ClickUp | each of `Review`, ` in review ` | planned | Eligible |
| ClickUp | each of `Code Review`, `Awaiting Review`, `Under Review` | planned | Eligible; transition also classifies as review |
| ClickUp | each of `Code Review`, `Awaiting Review`, `Under Review` | planned, inspected | Skip |
| ClickUp | each of `Review Complete`, `Review Blocked` | planned | Skip |
| ClickUp | `In Review` | planned, inspected | Skip |
| ClickUp | each of `In Progress`, `Done`, `Closed`, `Canceled`, `Blocked`, missing status | planned | Skip |
| Both | waiting | empty array or only `Agent-Planned` | Skip |
| Both | review | planned, `Agent-Inspected` | Eligible |
| Both | waiting or review | missing, null, or malformed collection | Error |

Here `planned` and `inspected` stand for the exact names `agent-planned` and
`agent-inspected`. Use Linear arrays of strings and ClickUp arrays of
`{"name":"<exact tag>"}` objects.

## Ordering and results

Run each case for both adapters. Use IDs A, B, C in provider order; give every
eligible item a distinct title, URL, and destination to verify field copying.
Linear timestamps are ISO-8601 with offsets; ClickUp timestamps are equivalent
Unix millisecond strings.

| First page | Expected |
| --- | --- |
| A waiting updated Oct 3; B review updated Oct 1; C waiting updated Oct 2 | B's exact four-field JSON |
| A review updated Oct 3 after label removal; B waiting updated Oct 2 | B |
| A inspected review updated Oct 1; B waiting updated Oct 2 | B |
| A in progress updated Oct 1; B review updated Oct 2 | B |
| A and B eligible with equal normalized timestamps | A |
| Linear A `2026-10-01T01:00:00+01:00`; B `2026-10-01T00:00:00Z` | A |
| Empty page, with or without a later-page cursor | Empty JSON result |
| Nonempty page with only ineligible items and a later-page cursor | Empty JSON result; no second call |
| A valid eligible item; B eligible with missing, null, or invalid timestamp | Error; no selection |
| Ineligible item with invalid timestamp; valid eligible B | B |
| Oldest eligible item has no destination; later eligible item has one | Error; no substitute |
| Provider call fails | Existing provider error; no empty result |

For invalid timestamps include `""`, `"not-a-date"`, and a negative ClickUp
timestamp. Assert one provider call, no item reads, no mutation, and no
additional output fields in every successful selection case.

## Safe resumption

Use disposable Git repositories, never the active project, for checkout
scenarios. Follow `../workflows/work-resume.md` with a mocked exact open request.
Capture branch, HEAD, index, tracked and untracked contents before each attempt.

| Setup | Expected |
| --- | --- |
| Another item branch active; linked source branch exists, clean and current | Switch to the exact source branch before editing any plan or file; reuse plan and request; move the item to in progress |
| Source branch already active and clean | Preserve identity and continue |
| Missing, multiple, or contradictory request identities | Stop before checkout or file edits; no request search |
| Linked request is closed or merged | Stop before checkout or file edits |
| Draft or non-draft open request | Both accepted for resumption |
| Missing, invalid, or default source branch | Stop before file edits; no branch creation |
| Source repository differs or is unavailable, including a fork with the same branch name | Stop before checkout or file edits |
| Dirty index, dirty tracked files, or untracked files | Stop before switch; preserve every byte and branch |
| Source branch checked out in another worktree | Git rejects switch; stop with original branch and files intact |
| Missing upstream, wrong repository or source branch, behind or diverged | Stop before plan or implementation edits |
| Upstream ref is stale relative to the observed request head | Stop before plan or implementation edits |
| Item in-progress transition fails after safe checkout | Stop before todo changes; report observed failure |

Verify that no corrective todo is appended and no todo state changes until
request resolution and safe checkout succeed. Verify no new plan, branch,
request, initialization commit, or backlink in every resumed case.

## Inspection timing

- `/ready` promotes the request and hands off while the item stays in progress.
- Blocking inspection findings return to `/work` before the final label or
  review transition.
- Successful inspection applies `agent-inspected` before transitioning to
  review, then reports completion.
- Label failure stops without a review transition.
- Failed or ambiguous review transition reports the observed request outcome,
  `agent-inspected applied`, the exact remaining transition, and incomplete
  delivery. It does not claim completion.
- Run `npm test` and `npm run build` after the scenarios pass.
