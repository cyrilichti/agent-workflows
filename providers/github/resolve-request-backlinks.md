# resolve-request-backlinks

Keep only URLs whose host, owner, and repository exactly match the resolved
repository and whose path is `/<owner>/<repo>/pull/<number>`. Return the unique
pull-request numbers. Ignore foreign or malformed URLs without following them.

