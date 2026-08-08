# Skills

This directory contains Skills installed under `.agents/skills/`.

Local Skills maintained by this project are thin discovery bridges that load the
owning workflow without duplicating its instructions.

External Skills are restored, ignored dependencies recorded in
`../skills-lock.json`. Their source and maintenance remain upstream.

```text
<workflow>/         # Local bridge, committed
  SKILL.md
<managed-external>/ # Restored dependency, ignored
  SKILL.md
```

`SKILL.md` is the entrypoint. Optional supporting content belongs in
`references/`, `scripts/`, or `assets/`.

See the [installation documentation](https://cyrilichti.github.io/agent-workflows/installation/)
for dependency setup.
