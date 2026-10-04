# Resolve Local Project Directory

Find Git repositories matching a `list` name.

## Input

- `list`: destination name.

## Steps

1. Read `${CODEX_HOME}/config.toml` (`~/.codex/config.toml` if `CODEX_HOME`
   is unset) and match the absolute paths in its `projects` table. An absent
   file provides no paths; report read or parse errors. Return configured
   matches without searching elsewhere.
2. If none match, search under `~` with filesystem listing tools, breadth
   first, up to four levels and 10,000 directories. Do not follow symlinks or
   enter `.git` or `node_modules`. Return `{"status":"search limit reached"}`
   if the bound is reached or `{"status":"search incomplete"}` if a needed
   directory cannot be read, even when some matches were found.
3. Return `{"path":"<absolute canonical path>"}` for one best match,
   `{"candidates":["<absolute canonical path>",...]}` for several, sorted by
   path, or `{"status":"not found"}` after a complete search with no match.

## Matching

Match only directories containing a `.git` file or directory. Ignore case,
whitespace, hyphens and points for exact basename matches. Otherwise, allow a
prefix only at a whitespace, hyphen or point boundary (`aftersales` matches
`aftersales-api`, not `aftersalesman`). Exact matches outrank prefix matches.
