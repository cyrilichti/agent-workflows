# Resolve Local Project Directory

Resolve one provider destination name to an absolute local directory.

## Input

- `list`: the `list` string returned by `/next`.

## Steps

1. Run the adjacent `resolve-local-project-directory.mjs` file with Node.js,
   passing `list` as one argument without shell interpolation. Use the script's
   absolute path so this works from either a source checkout or an installed
   `.agents/commands` directory.
2. Return its single JSON result unchanged. A nonzero exit is an error, not a
   `not found` result.

## Search Contract

The resolver compares directory basenames after lowercasing and removing
whitespace, hyphens, and points. Exact matches take priority. When none exist,
a product name may match a repository name only at a whitespace, hyphen, or
point boundary; `aftersales` matches `aftersales-api` but not `aftersalesman`.
It only accepts Git repository roots with a `.git` directory or file
(including worktrees). It first reads project paths from
`${CODEX_HOME}/config.toml`, or `~/.codex/config.toml` when `CODEX_HOME` is
unset. A unique existing repository match returns its absolute real path
without fallback. Multiple configured matches at the preferred match level
return `multiple matches`.

When no configured path matches, the resolver scans under `~` breadth first,
through depth 4, inspecting at most 10,000 directories. It does not traverse
symbolic links, `.git`, or `node_modules`. If the limit is reached or a
directory cannot be read, it returns `search limit reached` or
`search incomplete` rather than an uncertain path. This fallback is local and
read-only. A product name that matches several repositories returns
`multiple matches` and no path.
