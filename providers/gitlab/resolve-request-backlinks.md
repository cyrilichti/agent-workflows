# resolve-request-backlinks

Keep only URLs whose host exactly matches the caller repository `host`, whose
decoded project path exactly matches the caller repository `path`, and whose
remaining path is `/-/merge_requests/<iid>`. Return the unique merge-request
IIDs. Ignore foreign or malformed URLs without following them.
