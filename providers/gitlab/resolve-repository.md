# resolve-repository

Parse the caller push remote, remove its host and one trailing `.git` suffix,
then URL-encode the remaining namespace and project path as the repository
identity expected by the GitLab MCP. Preserve every namespace segment. Stop
when the path is empty or does not identify a project; do not contact GitLab to
infer it.

