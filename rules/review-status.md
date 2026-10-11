# Review Status

Use this name classification in provider selection and status-transition
adapters so they agree on which statuses represent review.

Trim surrounding whitespace and compare case-insensitively. A status name
qualifies when its whole meaning clearly identifies awaiting or undergoing
review. This includes `Review`, `In Review`, `Code Review`, `Awaiting Review`,
`Under Review`, and equivalent unambiguous custom review names.

Missing or ambiguous names do not establish review. A name describing completed
review, terminal work, or another activity does not qualify merely because it
contains the word `review`. Provider-native terminal and waiting categories
retain their adapter-defined precedence.
