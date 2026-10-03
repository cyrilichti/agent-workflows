# publish-review

Follow `./cli-conventions.md`. Publish the supplied findings as one review at
the caller's frozen head SHA. The caller has already checked that the pull
request is open, non-draft, and still at that SHA.

1. Build one JSON body for `POST repos/<owner>/<repo>/pulls/<number>/reviews`.
   Set `commit_id` to the frozen SHA and omit `event` so GitHub creates a
   pending review. Join the exact bodies of findings without a valid line
   anchor into the review `body`, in stable order, separated only by a blank
   line. Put each valid line-anchored finding in the `comments` array with its
   exact body, path, line, side, and start line/side when the range is valid.
   Keep each finding ID inside its exact body. A file-level or unsupported
   anchor belongs in the review body rather than an invented line position.
2. Run `gh api --hostname <host> --method POST --input -
   repos/<owner>/<repo>/pulls/<number>/reviews` once with that JSON on standard
   input. Require a parseable response containing the new numeric review ID
   and pending state. Stop on failure or ambiguity; do not search, retry,
   delete, or create another review.
3. Submit that exact pending review once with `gh api --hostname <host>
   --method POST --input -
   repos/<owner>/<repo>/pulls/<number>/reviews/<review ID>/events`. Send a
   JSON body with `event` mapped from `request_changes` to `REQUEST_CHANGES`,
   `approve` to `APPROVE`, or `none` to transport-only `COMMENT`. Require the
   response to identify the same review.

Return the review ID, each attempted command result, and the submission
response for caller observation. On failed or ambiguous submission, return the
pending review ID and stop without another mutation. Do not create issue
comments. Pass every value as a separate process argument; do not invoke a
shell or open an editor.

GitHub review API: https://docs.github.com/en/rest/pulls/reviews
