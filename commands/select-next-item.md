# Select Next Item

Find the oldest eligible official item without an item reference.

## Input

- `provider`: the configured item provider returned by `resolve-item-provider.md`.

## Steps

1. Load `../providers/<provider>/select-next-item.md`. Stop when it is missing.
2. Follow that adapter to enumerate **all** open items carrying the exact
   `agent-shaped` label or tag across the provider's entire configured
   workspace. Do not constrain the search to a project, team, list, assignee,
   or current user. Follow every page and destination until complete.
3. Require a creation timestamp for each candidate. Stop with a provider error
   if a candidate's timestamp cannot be determined; never guess its age.
4. Sort candidates by creation timestamp ascending, then by provider item ID
   ascending using a stable lexical comparison. De-duplicate repeated IDs.
5. In that order, individually read each candidate until one still has the
   exact label or tag and an open status. A candidate that changed since the
   list call is stale; continue to the next candidate.
6. Return only the verified item's current `{name, id, url}`. If every
   candidate is stale or none were listed, return exactly
   `{ "status": "no eligible item" }`.

Do not treat a provider error, incomplete page, missing timestamp, or failed
individual read as an empty result. Do not call any mutating provider tool.
