# Playbook

## Purpose

Determine which playbook should be used before starting non-trivial project work.

A playbook defines how a specific type of work is performed. Once a playbook has been selected, control is delegated to the corresponding workflow.

This workflow acts only as a router.

---

## Trigger

Run this workflow at the beginning of a new IDE conversation, or when the developer starts a new unrelated task, and no playbook has been selected.

---

## Steps

1. Ask the developer which type of task they want to start for this session.

   Use `.agents/templates/select-option.md` for this selection.

   Available playbooks:

   * Develop a feature
   * Other

2. Wait for the developer to select one task type.

3. Delegate execution to the corresponding workflow:

   * Develop a feature → `.agents/workflows/feature.md`

4. Stop this workflow after delegating to the selected playbook.

---

## Success Criteria

This workflow is complete when:

* a playbook has been selected;
* the corresponding workflow has been identified;
* execution has been delegated to that workflow.

---

## Safety

* If the task type clearly matches an available playbook, select it.
* If multiple playbooks could match, ask for clarification.
* If no available playbook matches, stop and explain that no playbook is
  available.
