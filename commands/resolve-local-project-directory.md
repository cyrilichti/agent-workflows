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
3. Search only these two tiers, without recursion. Complete each tier before
   choosing or moving to the next. If inspection is incomplete, return
   `{"status":"search incomplete"}` even when a match was found.
4. Within the first tier that contains matches, apply the matching priorities
   below. Deduplicate and sort the retained absolute canonical paths. Return
   `{"path":"<path>"}` for one retained path or
   `{"candidates":["<path>",...]}` for several. Return
   `{"status":"not found"}` when both tiers finish without a match.

## Matching

Match only directories containing a `.git` file or directory at their root.
Normalize the `list` and each repository basename: lowercase, replace runs of
whitespace, hyphens and points with one hyphen, and trim leading and trailing
hyphens. Ignore empty normalized names.

1. **Full basename:** a normalized basename matches when `-<list>-` contains
   `-<basename>-`. Retain every match with the longest normalized basename.
2. **Repository family:** only when no full basename matches in the tier,
   consider each non-empty prefix of a normalized basename ending before a
   hyphen. A prefix matches when `-<list>-` contains `-<prefix>-`. Retain every
   repository with the longest matching prefix across the tier.

Keep all ties for selection from the item. For example, `baz foo bar` prefers
`foo-bar` over `bar`; `baz foo` retains both `foo-bar` and `foo-baz` when neither
full basename matches.
