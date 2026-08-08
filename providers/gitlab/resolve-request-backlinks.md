# resolve-request-backlinks

Keep only URLs served by the configured GitLab provider whose decoded project
path exactly matches the resolved repository and whose remaining path is
`/-/merge_requests/<iid>`. Return the unique merge-request IIDs. Ignore foreign
or malformed URLs without following them.

