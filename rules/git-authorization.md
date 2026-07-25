# Git Use

Do not run Git merely because the current directory is a repository.

Use Git only when:

- the user explicitly requests a Git-related operation; or
- an applicable project instruction explicitly requires Git for the current
  task.

A greeting, session start, project file inspection, implementation request, or
authorization to edit files does not by itself require Git. Do not run routine
Git checks during bootstrap or before ordinary work.

When Git use is required, run only the commands necessary for the requested or
instructed operation. Do not request additional authorization for each
non-destructive command already covered by that operation.

Git operations that change the working tree, index, references, history,
stash, tags, submodules, or remotes must remain directly relevant to the
requested or instructed operation. If the required mutation is ambiguous or
materially broader than its authorization, ask before running it.
