# Next

## Purpose

Select the oldest open `agent-shaped` item from the configured provider and
return only its identity. This is a standalone, read-only entry point.

## Required Context

Load `../goals/next-complete.md` as this workflow's completion contract.
Follow `../rules/user-facing-output.md`.

## Steps

1. Run `../commands/resolve-item-provider.md` with `context: item`.
2. Run `../commands/select-next-item.md` with that provider. No item reference,
   title, project, team, list, or assignee is required from the caller.
3. Return the command result as one JSON object, without a Markdown fence or
   surrounding text:

   ```json
   {"name":"<current title>","id":"<provider ID>","url":"<item URL>"}
   ```

   If the complete search has no eligible item, return exactly:

   ```json
   {"status":"no eligible item"}
   ```

On a provider failure, report the error and stop. Do not return the empty
outcome for a failure. Do not call `/pick`, `/plan`, or `/work`, create a plan,
or mutate an item or repository.
