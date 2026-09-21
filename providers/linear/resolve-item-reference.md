# Resolve Item Reference

Accept a Linear identifier such as `ICY-47`, or a native Linear issue URL whose
path contains `/issue/<identifier>/`. Reject every other URL host or shape.

Return the identifier unchanged or extracted from the URL. The caller must use
`get_issue` through `read-item.md` to establish official context; parsing the
reference is never proof that the issue exists.
