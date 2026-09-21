# Resolve Item Reference

Accept a ClickUp task ID, or a native ClickUp task URL whose path identifies
exactly one task after `/t/`. Reject every other URL host or shape.

Return the task ID unchanged or extracted from the URL. The caller must use
`clickup_get_task` through `read-item.md` to establish official context; parsing
the reference is never proof that the task exists.
