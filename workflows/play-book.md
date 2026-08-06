# Playbook

Route non-trivial project work to one playbook workflow. Run at the start of a
new IDE conversation or unrelated task when no playbook is selected yet. Stop
after delegating.

## Steps

1. Ask which task type to start using `../templates/select-option.md` with:

   ```text
   question: Which type of task do you want to start?
   options:
   - Write an item
   - Pick an item
   - Create a plan
   - Refine an item
   - Execute a plan
   - Prepare work for review
   - Complete a request
   - Other
   ```

2. Wait for exactly one selection.

3. Delegate to the matching workflow, then stop:

   * Write an item → `./write.md`
   * Pick an item → `./pick.md`
   * Create a plan → `./plan.md`
   * Refine an item → `./refine.md`
   * Execute a plan → `./work.md`
   * Prepare work for review → `./ready.md`
   * Complete a request → `./done.md`

## Safety

* If the task clearly matches one playbook, select it without asking.
* If several could match, ask for clarification.
* If none match, stop and explain that no playbook is available.
