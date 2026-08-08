# Providers

This directory contains adapters installed under `.agents/providers/` for
external work-item and version-control systems.

Provider operations live in `<provider>/<operation>.md`. Each operation file is
the authoritative mapping from a generic command to concrete tools and
arguments.

Providers execute supplied criteria; they do not select work or orchestrate
workflows. Commands load only the exact operation they require.

See the [provider documentation](https://cyrilichti.github.io/agent-workflows/providers/)
for configuration and supported integrations.
