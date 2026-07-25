# Installation

## Add my-agentic

Install the repository as a submodule, then expose its project entry points:

```bash
git submodule add https://github.com/seeren/my-agentic.git .agents
ln -s .agents/AGENTS.md AGENTS.md
ln -s .agents/CLAUDE.md CLAUDE.md
ln -s .agents/.cursor .cursor
ln -s .agents/skills-lock.json skills-lock.json
```

## Restore Managed Skills

Install the external Skill dependencies recorded in `skills-lock.json`:

```bash
npx skills experimental_install
```

The dependencies are restored into `.agents/skills/`. Their directories remain
ignored by the my-agentic submodule because their source and updates stay owned
by their upstream projects.

my-agentic continues to own the workflows. The restored Skills only provide
capabilities used by specialized agents inside those workflows.
