# Git Use

Do not run Git merely because the directory is a repository.

Use Git only when the user explicitly requests a Git-related operation, or an
applicable project instruction requires Git for the current task. Greetings,
session start, file inspection, implementation requests, and edit authorization
do not by themselves require Git. Skip routine Git checks during bootstrap or
before ordinary work.

When Git is required, run only the commands needed for that operation; do not
re-authorize each covered non-destructive command. Mutations to the working
tree, index, references, history, stash, tags, submodules, or remotes must stay
directly relevant. If a required mutation is ambiguous or materially broader
than its authorization, ask first.
