# update-request

Follow `./cli-conventions.md`. Keep the repository host, owner, repo, and
exact request number fixed for the entire action.

For `replace-description`, run one `gh api --hostname <host> --method PATCH
--input - repos/<owner>/<repo>/pulls/<number>` with a JSON object containing
only `body: <caller exact replacement body>`.

For `mark-ready`, when the caller supplies a ready title, first run one
`gh api --hostname <host> --method PATCH --input -
repos/<owner>/<repo>/pulls/<number>` with a JSON object containing only that
`title`. After it succeeds, run `gh pr ready <number> --repo
<host>/<owner>/<repo>` once. When no title is supplied, run only `gh pr ready`.

Stop immediately on a failed or ambiguous command. In particular, do not run
`gh pr ready` after an ambiguous title update. Return each attempted command's
exit, stdout, stderr, and any returned pull request identity; the caller owns
the postcondition read. Do not change the base, state, reviewers, maintainer
settings, or any other field. Do not combine the two actions or retry.
