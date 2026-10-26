# AGENTS.md

## Request Routing

1. For every user request, identify every matching route using this table:

   | Situation | Workflow |
   | --- | --- |
   | Select the next eligible item (`/next` or `$next`) | `workflows/next.md` |
   | Resolve a local project directory (`/project` or `$project`) | `workflows/project.md` |
   | Create or reformulate one item (`/write` or `$write`) | `workflows/write.md` |
   | Select an item, plan it, and start its implementation (`/pick` or `$pick`) | `workflows/pick.md` |
   | Create an implementation plan (`/plan` or `$plan`) | `workflows/plan.md` |
   | Decompose one oversized item into child items (`/refine` or `$refine`) | `workflows/refine.md` |
   | Execute a plan (`/work` or `$work`) | `workflows/work.md` |
   | Prepare work for review (`/ready` or `$ready`) | `workflows/ready.md` |
   | Review a pull or merge request (`/inspect` or `$inspect`) | `workflows/inspect.md` |
   | Complete a pull or merge request (`/done` or `$done`) | `workflows/done.md` |

2. When several routes match, reduce them to one by asking with
   `templates/select-option.md`:

   ```text
   question: Which workflow do you want to use?
   options:
   - label: <matching situation>
     value: <workflow file>
   ```

3. When one route remains, read its workflow file completely and follow it.
4. When no route matches, select a profile from the table in
   `workflows/specialist.md`. If none fits, continue without a specialist.
   Otherwise, follow `workflows/specialist.md` with:

   ```text
   profile: selected profile
   task_context: available request context
   ```

   Then continue handling the original request.
