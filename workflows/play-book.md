# Playbook

Route every user request to one playbook workflow when its situation matches.
Routing means loading and following the workflow file in the current agent.

## Routes

| Situation | Workflow |
| --- | --- |
| Create or reformulate one item | `./write.md` |
| Select an item, plan it, and start its implementation | `./pick.md` |
| Create an implementation plan | `./plan.md` |
| Decompose one oversized item into child items | `./refine.md` |
| Execute a plan | `./work.md` |
| Prepare work for review | `./ready.md` |
| Review a pull or merge request | `./inspect.md` |
| Complete a pull or merge request | `./done.md` |

## Routing

Evaluate every user request against the routes above.

1. Identify every matching route.
2. When several routes match, reduce them to one by asking with
   `../templates/select-option.md`:

   ```text
   question: Which workflow do you want to use?
   options:
   - label: <matching situation>
     value: <workflow file>
   ```

3. When one route remains, read its workflow file completely and follow it.
4. When no route matches, the playbook does nothing. Continue handling the
   request normally.
