# `/write`

It guides the user from the initial request to a confirmed item then saves it and applies the chosen assignment.

## Writing and Dynamic Routing

`/write` re-evaluates the conversation as it becomes clearer and selects the
Skill that matches its current state:


| Current state                                                       | Example                                                       | External Skill                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| The request vague                                                   | “I need to work on Elasticsearch.”                            | `[interview-me](https://github.com/addyosmani/agent-skills)` — Addy Osmani |
| The context is understood, but the expected behavior remains open   | “I am not sure how it should behave.”                         | `[idea-refine](https://github.com/addyosmani/agent-skills)` — Addy Osmani  |
| A direction exists and the user wants its decisions challenged      | “Can you challenge this approach?”                            | `[grilling](https://github.com/mattpocock/skills)` — Matt Pocock           |
| The user wants them converted into a full, structured specification | “Turn everything we agreed on into a complete specification.” | `[to-spec](https://github.com/mattpocock/skills)` — Matt Pocock            |


After each meaningful answer, `/write` re-evaluates the route until the work
item is sufficiently defined. The selected Skill is shown when the route starts
or changes, but its name is never included in the item. `to-spec` is
selected only when the user explicitly wants a specification-oriented ticket.

## Confirmation

Each adjustment returns to confirmation. No item is created or updated until
the user explicitly approves its content.

## Assignment

After content confirmation, `/write` asks how to handle assignment:

- a new item can remain unassigned or be assigned;
- a reformulated item can keep its current assignment or be assigned or
reassigned.
