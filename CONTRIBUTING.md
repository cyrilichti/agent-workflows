# Contributing to Agent Workflows

Agent Workflows turns focused agent skills into controlled delivery workflows.
Contributions should improve that delivery system rather than add standalone
prompts or duplicate upstream expertise.

## Propose a workflow

A workflow must own one clear delivery outcome. Before writing files, describe:

- **Outcome:** what becomes true when the workflow completes.
- **Trigger:** when the workflow should be invoked.
- **Context:** what it requires and what it preserves.
- **Sequence:** the decisions and operations it controls.
- **Skills:** which external skills it dispatches, and under which conditions.
- **Mutations:** which item or version-provider operations it can perform.
- **Approvals:** where explicit human confirmation is required.
- **Handoff:** which workflow can receive the approved result next.
- **Completion:** measurable success criteria and stop conditions.

Keep the workflow provider-neutral. It may choose and sequence work, but generic
commands must own repeated operations and provider adapters must own concrete
tool calls.

For a substantial new workflow, open an issue first with this outline so its
scope and place in the lifecycle can be agreed before implementation.

## Implement the workflow

Use an existing workflow such as `/write` or `/plan` as the structural reference.
A complete workflow contribution normally includes:

| Path | Responsibility |
| --- | --- |
| `workflows/<name>.md` | Main sequence, routing, approvals, and boundaries |
| `workflows/<name>-*.md` | Branches that keep the main workflow readable |
| `goals/<name>-complete.md` | Outcome, success criteria, validation, and stop conditions |
| `skills/<name>/SKILL.md` | Thin discovery bridge to the owning workflow |
| `skills/<name>/agents/openai.yaml` | Optional OpenAI/Codex display metadata |
| `docs/workflows/<name>.mdx` | Product-oriented workflow documentation |

The local `SKILL.md` must not duplicate workflow instructions. It should identify
when the workflow is used and load the authoritative file from `workflows/`.
Add `agents/openai.yaml` only when the skill needs a display name, short
description, or default prompt in compatible OpenAI/Codex clients. It does not
control workflow behavior.

When the workflow belongs in the main playbook, also update:

- `workflows/play-book.md` with its selection and delegation;
- `.gitignore` so its local skill bridge is tracked;
- `docs/workflows/index.mdx` with its workflow card;
- `astro.config.ts` with its documentation page;
- `docs/index.md` when it changes the product lifecycle presented on the home;
- `docs/styles/custom.css` when the workflow needs its own visual identity.

If the workflow needs a reusable operation that does not exist yet, add a generic
command under `commands/` and implement it for every supported provider under
`providers/`. Do not embed provider-specific calls in the workflow or a skill.

## Add external skill dependencies

Prefer a focused, maintained upstream skill over copying specialist instructions
into this repository. Every external skill used by a workflow must be declared in
`skills-lock.json`.

From the repository root, add the dependency with:

```bash
npx skills add <owner/repository> --skill <skill-name>
```

Then verify that:

- `skills-lock.json` records the source, path, and computed hash;
- the workflow loads the dependency from `../skills/<skill-name>/SKILL.md`;
- the workflow explains why and when that skill is selected;
- restored external skill files remain ignored and are not committed;
- the upstream skill license permits the intended use.

Commit the lock-file change, not a vendored copy of the external skill. Avoid
adding overlapping dependencies unless the workflow has an explicit routing rule
that distinguishes them.

## Preserve control boundaries

Workflows may inspect context autonomously, but consequential mutations must stay
explicit. Require human approval before operations such as:

- creating or updating work items;
- assigning or transitioning an item;
- creating commits or pushing branches;
- publishing a review or changing a request;
- merging a request or completing its official item.

The workflow must also define what happens when approval is declined or an
operation fails. A failure must stop cleanly without pretending the goal was met.

## Validate the contribution

Restore declared skills when the lock file changed:

```bash
npx skills experimental_install
```

Build the documentation and check the patch:

```bash
ASTRO_TELEMETRY_DISABLED=1 npm run build
git diff --check
```

Read the complete workflow once from its entrypoint and verify at least:

- the successful path;
- a declined approval;
- an external operation failure;
- every supported provider path affected by the contribution;
- the handoff to another workflow, when one exists.

Do not commit generated documentation output, restored external skills, local
provider configuration, or generated plans.

## Open the pull request

Keep one workflow or one focused behavior change per pull request. The PR should
include:

- the delivery problem and intended outcome;
- the workflow trigger, boundaries, and handoff;
- each added skill dependency, its upstream source, and why it is needed;
- every provider mutation and its approval boundary;
- validation performed and providers covered;
- screenshots when documentation or visual identity changed.

Use a clear title such as `feat(workflow): add /<name>`. Link the proposal issue
when one exists, and call out any behavior that remains intentionally out of
scope.
