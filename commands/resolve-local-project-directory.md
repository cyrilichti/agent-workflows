# Resolve Local Project Directory

Find Git repositories matching a `list` name.

## Input

- `list`: destination name.

## Steps

1. Read `${CODEX_HOME}/config.toml` (`~/.codex/config.toml` if `CODEX_HOME`
   is unset) and match the absolute paths in its `projects` table. An absent
   file provides no paths; report read or parse errors. Return configured
   matches without searching elsewhere.
2. If none match, inspect Git repositories directly inside the parent
   directories of the configured paths, in path order. Stop at the first exact
   match; otherwise return any matching repositories before searching farther.
3. If none match there, locate `.git` files or directories under `~` and match
   only their parent repositories. Do not follow symlinks or enter `.git`,
   `node_modules`, or a repository once found. Stop at the first exact match;
   use no arbitrary directory count or depth limit.
4. If the home search is incomplete and found no exact match, return
   `{"status":"search incomplete"}`. Otherwise return
   `{"path":"<absolute canonical path>"}` for one best match or
   `{"candidates":["<absolute canonical path>",...]}` for several, sorted by
   path. Return `{"status":"not found"}` only after a complete search with
   no match.

## Matching

Match only directories containing a `.git` file or directory. Ignore case,
whitespace, hyphens and points for exact basename matches. Otherwise, allow a
prefix only at a whitespace, hyphen or point boundary (`aftersales` matches
`aftersales-api`, not `aftersalesman`). Exact matches outrank prefix matches.
