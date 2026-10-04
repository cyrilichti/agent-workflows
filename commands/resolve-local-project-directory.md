# Resolve Local Project Directory

Resolve one provider destination name to Git repository roots using filesystem
reads and listings.

## Input

- `list`: the `list` string returned by `/next`.

## Steps

1. Read `${CODEX_HOME}/config.toml`, or `~/.codex/config.toml` when
   `CODEX_HOME` is unset. Extract the absolute paths from its `projects`
   table entries. If the file is absent, continue with no configured paths;
   report a read or parse error rather than treating it as an empty file.
2. Reject an empty `list` with `{ "status": "invalid list" }`.
3. Inspect those paths for matching repository roots. Accept a directory only
   when it contains a `.git` directory or file, including a worktree marker.
   Compare its basename to `list` using the matching rules below. After
   checking the configured paths, return one absolute, canonical path for a
   unique best match, or all paths at the best match level as `candidates` for
   the caller. Stop there when any configured path matches.
4. Only when no configured path matches, inspect directories under `~` with
   ordinary filesystem listing tools. Traverse breadth first, at most four
   levels below `~`, and inspect at most 10,000 directories in total. Do not
   follow symbolic links or enter `.git` or `node_modules`. Keep only Git
   repository roots and apply the matching rules below. If the bound is
   reached, return `{ "status": "search limit reached" }`; if a required
   directory cannot be read, return `{ "status": "search incomplete" }`.
5. Return one absolute, canonical path for a unique best match, sorted
   absolute `candidates` for several best matches, or
   `{ "status": "not found" }` when the complete bounded search found none.

## Matching Rules

Lowercase each name and remove whitespace, hyphens, and points for exact
comparison. Exact matches outrank prefix matches. A prefix matches only when
the directory name continues after a whitespace, hyphen, or point boundary:
`aftersales` matches `aftersales-api`, but not `aftersalesman`.

The command returns only `{ "path": "<absolute path>" }`,
`{ "candidates": ["<absolute path>", ...] }`, or an unresolved `status`. The
workflow chooses among candidates using the complete ticket and keeps the
candidate paths out of its final response.
