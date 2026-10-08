# publish-review

The caller supplies findings and a frozen SHA for an open, non-draft pull request. Create one pending review at that SHA. Put valid line anchors in `comments` with exact body, path, line, side, and valid range fields. Join unanchored finding bodies in stable order in the review `body`, separated by blank lines. Preserve each finding ID in its body; never invent an anchor.

Build a payload object with `commit_id` set to the frozen SHA, `body` set to the
joined unanchored findings, and `comments` set to the anchored findings. Serialize
it with a JSON encoder into a UTF-8 temporary file, preserving exact finding
text and numeric anchor fields. Pass that file to `gh`:

```text
command: gh
arguments:
  - api
  - --hostname
  - caller repository host
  - --method
  - POST
  - --input
  - temporary payload file path
  - repos/<owner>/<repo>/pulls/<number>/reviews
```

Omit `event`; require a numeric review ID and pending state. Submit that ID once, mapping `request_changes` to `REQUEST_CHANGES`, `approve` to `APPROVE`, and `none` to `COMMENT`:

```text
command: gh
arguments:
  - api
  - --hostname
  - caller repository host
  - --method
  - POST
  - --raw-field
  - event=<mapped event>
  - repos/<owner>/<repo>/pulls/<number>/reviews/<review ID>/events
```

Require the submitted response to identify the same review. Return both command results, review ID, and submission response. On failure or ambiguity, stop and retain the pending ID; do not search, retry, delete, or create another review or issue comment. Pass arguments separately without a shell or editor.

Remove the temporary payload file after the attempt, including on failure.

GitHub review API: https://docs.github.com/en/rest/pulls/reviews
