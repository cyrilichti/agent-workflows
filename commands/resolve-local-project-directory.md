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
   enter `.git` or `node_modules`. Record unreadable directories and whether
   the limit was reached.
3. In the fallback search, keep exact matches even if other directories were
   unreadable or the limit was reached. Without an exact match, report
   `{"status":"search limit reached"}` or `{"status":"search incomplete"}`
   before considering prefix matches. Return `{"path":"<absolute canonical
   path>"}` for one best match or `{"candidates":["<absolute canonical
   path>",...]}` for several, sorted by path. Return `{"status":"not found"}`
   only after a complete search with no match.

## Matching

Match only directories containing a `.git` file or directory. Ignore case,
whitespace, hyphens and points for exact basename matches. Otherwise, allow a
prefix only at a whitespace, hyphen or point boundary (`aftersales` matches
`aftersales-api`, not `aftersalesman`). Exact matches outrank prefix matches.
