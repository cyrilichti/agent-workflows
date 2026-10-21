# AGENTS.md

## Request Routing

Route every user request to one workflow when its situation matches. Routing
means loading and following the workflow file in the current agent.

| Situation | Workflow |
| --- | --- |
| Select the next eligible item (`/next` or `$next`) | `workflows/next.md` |
| Resolve a local project directory (`/project` or `$project`) | `workflows/project.md` |
| Create or reformulate one item | `workflows/write.md` |
| Select an item, plan it, and start its implementation | `workflows/pick.md` |
| Create an implementation plan | `workflows/plan.md` |
| Decompose one oversized item into child items | `workflows/refine.md` |
| Execute a plan | `workflows/work.md` |
| Prepare work for review | `workflows/ready.md` |
| Review a pull or merge request | `workflows/inspect.md` |
| Complete a pull or merge request | `workflows/done.md` |

Evaluate every user request against the routes above.

1. Identify every matching route.
2. When several routes match, reduce them to one by asking with
   `templates/select-option.md`:

   ```text
   question: Which workflow do you want to use?
   options:
   - label: <matching situation>
     value: <workflow file>
   ```

3. When one route remains, read its workflow file completely and follow it.
4. When no route matches, follow `workflows/specialist.md` with:

   ```text
   task_context: available request context
   ```

   Then continue handling the original request.

## Guidelines

- Load only the context required by the active workflow.
