# Plan Execute

## Input

| Input | Requirement |
| --- | --- |
| `task_context` | Objective, problem, and expected outcome |
| `entry_mode` | `workflow` or `standalone` |

## Steps

### 1. Assess the Delivery Unit

Run `../commands/assess-refinement-need.md` with:

```text
context: task_context
```

Continue only on `refinement-not-needed`. On `needs-refinement`, return the exact
findings to the caller in `workflow` mode, or report them and stop in
`standalone` mode. Create no plan file before this decision.

Follow `./specialist.md` once with `task_context` to activate the plan author.
The author may inspect technical context read-only. Run the same assessment
again if that inspection reveals separately deliverable units.

### 2. Author the Plan

The specialist is the sole author. From this file's directory, load applicable
Skills in one `cat` command. Include `planning-and-task-breakdown` for every
plan. Include `source-driven-development` only when a decision depends on an
unverified external versioned fact; use it only to verify and cite that fact.
Omit paths for Skills already active, and skip the command when none remain:

```sh
cat ../skills/planning-and-task-breakdown/SKILL.md ../skills/source-driven-development/SKILL.md
```

Announce each newly loaded Skill.

Write the plan under `../plans/{YYYY-MM-DD}-{objective-slug}.plan.md` with a
lowercase kebab-case slug of at most 40 characters; append `-2`, `-3`, etc.
when the filename exists. Its project-relative path is the canonical plan
reference and its H1 is the plan name. Use only supplied or inspected context,
the fewest small, verifiable todos, and this format:

```markdown
# <Plan title>

<for an official item: **Ticket :** [<exact item ID>](<exact item URL>)>

## Overview

<one-line objective and approach>

## Objective

<what must be achieved>

## Problem

<what must be solved and why it matters>

## Expected Outcome

<how success will be recognized>

## Steps

1. ○ <one-sentence actionable step>

## Validation

- [ ] <how the work will be checked>
```

The numbered `## Steps` list alone defines todo content, order, and state.
Use `○` pending, `◐` in progress, `✓` completed, or `⊘` cancelled between
number and content. Begin every todo pending; allow at most one in progress.
Only `/work` appends corrective todos, and cancellation requires explicit user
confirmation. Do not infer todo state from Validation checkboxes. Preserve
step text and order when changing state. Add `## Open Questions` only for
unresolved decisions. Use the exact supplied item ID and URL; omit the ticket
line for standalone plans. Add no other item, provider, Git, or request
metadata, Skill-specific format, estimate, file list, or checkpoint.

For high-risk or unfamiliar decisions, load and announce
`doubt-driven-development` and invoke one fresh-context reviewer with the
affected decision excerpts and `task_context` plus the plan contract. Apply
CLAIM, EXTRACT, DOUBT, and RECONCILE once. Pass no planning history or author
reasoning. Ask the same author for one revision: implementation gaps become
todos, verification gaps become Validation, and unresolved decisions become
Open Questions. Report remaining substantive uncertainty.

### 3. Resolve Material Questions

Collect answers to every question that could change Objective, Expected
Outcome, todos, their order, or Validation. Give answers to the same author and
require a complete revised plan until no material question remains.

### 4. Confirm the Plan

Present the complete final plan, then show:

```markdown
**Plan ready — <plan H1>**

[Open plan](<canonical plan file link>)

- **Todos:** <number of steps>
```

Use `Approve plan and autonomous delivery` in `workflow` mode, or `Approve
plan` in `standalone` mode. In `workflow` mode, explain that approval
authorizes non-empty commits, normal pushes, request creation and promotion,
request comments, item transitions and labels, review publication, and
corrective loops through successful `/inspect`; it does not authorize merge,
completion, or `/done`. In `standalone` mode, explain that approval covers the
plan and, for an official item, publication and labeling, without starting
delivery.

Ask once with `../templates/select-option.md`:

```text
question: What do you want to do with this plan?
options:
- <resolved approval option>
- Adjust plan
```

On `Adjust plan`, give the adjustment to the active author, then present the
revised complete plan and ask again. Return only an explicitly approved plan
to the calling context branch.
