# Playbook

## Purpose

Determine which playbook should be used before starting non-trivial project
work.

A playbook defines how a specific type of work is performed. Once a playbook has
been selected, control is delegated to the corresponding workflow.

This workflow acts only as a router.

---

## Trigger

Run this workflow at the beginning of a new IDE conversation, or when the
user starts a new unrelated task, and no playbook has been selected.

---

## Steps

1. Ask the user which type of task they want to start for this session
   using `../templates/select-option.md` with:

   ```text
   question: Which type of task do you want to start?
   options:
   - Write an item
   - Pick an item
   - Create a plan
   - Other
   ```

2. Wait for the user to select one task type.

3. Delegate execution to the corresponding workflow:

   * Write an item → `./write.md`
   * Pick an item → `./pick.md`
   * Create a plan → `./plan.md`

4. Stop this workflow after delegating to the selected playbook.

---

## Safety

* If the task type clearly matches an available playbook, select it.
* If multiple playbooks could match, ask for clarification.
* If no available playbook matches, stop and explain that no playbook is
  available.

---

## Success Criteria

This workflow is complete when:

* a playbook has been selected;
* the corresponding workflow has been identified;
* execution has been delegated to that workflow.
