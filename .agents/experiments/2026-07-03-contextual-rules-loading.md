# Experiment: Validate contextual rule loading

**Outcome:** failed · **Date:** 2026-07-03 · **Playbook:** Explore an idea · **Agent:** Codex

**Deliverable:** `.agents/rules/README.md`

## Results

| Area                     | Status | Notes                                                |
| ------------------------ | ------ | ---------------------------------------------------- |
| Global `alwaysApply`     | ❌     | created noise and repeated `AGENTS.md` guidance      |
| Coverage                 | ❌     | generic global rules did not cover 80% of real needs |
| `AGENTS.md` boundary     | ✅     | global agent behavior belongs in the entry point     |
| Contextual rules         | ✅     | constraints should be loaded by specialization       |
| Workflow specialization  | ✅     | workflows should decide which rules become relevant  |

## Learnings

* Global rules should not duplicate `AGENTS.md` or permanent workflow guidance.
* `alwaysApply` is too broad for generic development rules in this project.
* Rules become stronger when attached to an agent, skill, workflow, or file scope.
* Keep `rules/` as a contextual constraint library, not a global background prompt.
