# Resolve Version Provider

Resolve the MCP provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require the configured value to be `gitlab`.
4. Verify that the GitLab MCP and its `create_merge_request`,
   `gitlab_search`, and `get_merge_request` operations are available.
5. Return `gitlab`.

If the configuration or any required operation is missing, stop before Git or
provider mutation and explain what must be configured.
