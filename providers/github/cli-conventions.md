# GitHub CLI Conventions

Apply these conventions to every GitHub provider operation after the caller
has parsed the push remote through `resolve-repository.md`.

1. Require `gh` to be installed and run `gh auth status --active --hostname
   <repository host>` before the operation. Stop with the observed CLI or
   authentication error when either check fails. Do not print a token.
2. Address REST requests with `gh api --hostname <repository host>` and an
   explicit `repos/<owner>/<repo>/...` endpoint. Address `gh pr` commands
   with `--repo <host>/<owner>/<repo>`. Never rely on the current directory,
   default host, or a different remote to choose a repository.
3. Pass each argument as a separate process argument without invoking a shell.
   For structured request bodies, pass complete JSON through standard input
   with `--input -`. Do not open an editor or expose credentials in output.
4. Require a successful exit and a complete parseable response for reads.
   Use `gh api --paginate --slurp` for list endpoints, flatten its array of
   pages, and reject missing, malformed, or incomplete pages. Do not use
   formatted or filtered output when it could hide required records.
5. Run every mutation at most once. On failed or ambiguous output, retain any
   returned provider identity, stop the mutation sequence, and report the
   observed failure. Only the caller may perform its specified postcondition
   read. Do not retry or switch to another transport.

CLI reference: https://cli.github.com/manual/gh_api and
https://cli.github.com/manual/gh_auth_status
