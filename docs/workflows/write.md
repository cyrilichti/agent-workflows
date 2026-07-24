# `/write`

`/write` creates or reformulates one provider work item. It guides the
developer from the initial request to a confirmed title and body, then
saves the item and applies the chosen assignment.

## Writing and Dynamic Routing

`/write` selects the most relevant external Skill for the current context:

| Context | External Skill |
| --- | --- |
| Important information is missing | [`interview-me`](https://github.com/addyosmani/agent-skills) — Addy Osmani |
| The idea is open and needs refinement | [`idea-refine`](https://github.com/addyosmani/agent-skills) — Addy Osmani |
| Decisions and assumptions need deeper challenge | [`grilling`](https://github.com/mattpocock/skills) — Matt Pocock |
| The work has become a genuine specification | [`to-spec`](https://github.com/mattpocock/skills) — Matt Pocock |

Routing is dynamic rather than sequential. After a meaningful answer or a new
source, `/write` re-evaluates what the item needs. It may keep the current
approach, switch to another Skill, or stop questioning when the item is
sufficiently defined.

The result remains proportional to the request. A simple maintenance task
should produce a concise work item, not a specification with unnecessary
sections or detail.

## Confirmation

Each adjustment returns to confirmation. No item is created or updated until
the developer explicitly approves its content.

## Assignment

After content confirmation, `/write` asks how to handle assignment:

- a new item can remain unassigned or be assigned;
- a reformulated item can keep its current assignment or be assigned or
  reassigned.
