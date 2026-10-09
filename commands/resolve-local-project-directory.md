# Resolve Local Project Directory

Find Git repositories matching a `list` name.

## Input

- `list`: destination name.

## Steps

1. Ask the active execution environment for its configured project paths and
   inspect every available configured path before choosing. Use the project
   configuration exposed by the active AI provider; do not assume a
   provider-specific file or path. If the configuration is unavailable or
   cannot be read, use no configured paths and continue the search.
2. If that tier has no match, inspect Git repositories directly inside every
   parent directory of the configured paths, in path order, before choosing.
3. If that tier also has no match, locate `.git` files or directories under
   `~` and match only their parent repositories. Do not follow symlinks or
   enter `.git`, `node_modules`, or a repository once found. Use no arbitrary
   directory count or depth limit. If this search is incomplete, return
   `{"status":"search incomplete"}` even when it found a match, because
   competing matches remain unknown.
4. Within the first tier that contains matches, retain every exact match when
   any exist; otherwise retain every prefix match. Deduplicate and sort the
   retained absolute canonical paths. Return `{"path":"<path>"}` for one
   retained path or `{"candidates":["<path>",...]}` for several. Return
   `{"status":"not found"}` only after a complete search with no match.

## Matching

Match only directories containing a `.git` file or directory. Ignore case,
whitespace, hyphens and points for exact basename matches. Otherwise, allow a
prefix only at a whitespace, hyphen or point boundary (`aftersales` matches
`aftersales-api`, not `aftersalesman`). Exact matches outrank prefix matches.
