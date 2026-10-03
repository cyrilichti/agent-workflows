# publish-review

The caller supplies findings and a frozen SHA for an open, non-draft pull request. Create one pending review at that SHA. Put valid line anchors in `comments` with exact body, path, line, side, and valid range fields. Join unanchored finding bodies in stable order in the review `body`, separated by blank lines. Preserve each finding ID in its body; never invent an anchor.

```text
gh api --hostname <host> --method POST --input - repos/<owner>/<repo>/pulls/<number>/reviews
stdin JSON: {"commit_id":"<frozen SHA>","body":"<unanchored findings>","comments":[...]}
```

Omit `event`; require a numeric review ID and pending state. Submit that ID once, mapping `request_changes` to `REQUEST_CHANGES`, `approve` to `APPROVE`, and `none` to `COMMENT`:

```text
gh api --hostname <host> --method POST --input - repos/<owner>/<repo>/pulls/<number>/reviews/<review ID>/events
stdin JSON: {"event":"<mapped event>"}
```

Require the submitted response to identify the same review. Return both command results, review ID, and submission response. On failure or ambiguity, stop and retain the pending ID; do not search, retry, delete, or create another review or issue comment. Pass arguments separately without a shell or editor.

GitHub review API: https://docs.github.com/en/rest/pulls/reviews
